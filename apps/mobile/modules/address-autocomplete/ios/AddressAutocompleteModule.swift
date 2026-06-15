import ExpoModulesCore
import MapKit
import Contacts

// Native iOS address autocomplete backed by MapKit's MKLocalSearchCompleter.
// Free (no API key / billing) and on-device — keystrokes stay on Apple's stack.
//
// JS surface (see src/lib/addressAutocomplete.ts):
//   searchAddresses(query) -> [{ title, subtitle }]
//   resolveAddress(title, subtitle) -> "street, city, state zip, country"
public final class AddressAutocompleteModule: Module {
  private let completer = MKLocalSearchCompleter()
  private var completerDelegate: CompleterDelegate?
  // The single in-flight search promise. MKLocalSearchCompleter is delegate-based
  // and fires asynchronously, so we hold the promise and resolve it on the next
  // delegate callback. `pendingId` tags it (Promise is a struct, so we can't use
  // identity); the timeout only fires if its id is still the active one.
  private var pending: Promise?
  private var pendingId = 0
  private var requestCounter = 0
  // Latest completions, kept so resolveAddress can reuse the exact completion
  // object (best resolution) rather than re-running a fuzzy text search.
  private var lastResults: [MKLocalSearchCompletion] = []

  public func definition() -> ModuleDefinition {
    Name("AddressAutocomplete")

    OnCreate {
      DispatchQueue.main.async {
        self.completer.resultTypes = .address
        let delegate = CompleterDelegate(
          onResults: { [weak self] completions in self?.handleResults(completions) },
          onError: { [weak self] in self?.fulfill([]) }
        )
        self.completerDelegate = delegate
        self.completer.delegate = delegate
      }
    }

    // Returns address suggestions for a partial query. Resolves [] for blank
    // input, on error, or if MapKit doesn't respond within the timeout.
    AsyncFunction("searchAddresses") { (query: String, promise: Promise) in
      DispatchQueue.main.async {
        // Don't leak a previous in-flight promise — a newer keystroke supersedes it.
        self.pending?.resolve([])
        self.pending = nil
        self.pendingId = 0

        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
          promise.resolve([])
          return
        }

        self.requestCounter += 1
        let id = self.requestCounter
        self.pending = promise
        self.pendingId = id
        self.completer.queryFragment = trimmed

        // Safety net: MKLocalSearchCompleter never fires its delegate if the
        // fragment resolves to nothing new, which would hang the JS await forever.
        DispatchQueue.main.asyncAfter(deadline: .now() + 6.0) {
          if self.pendingId == id {
            self.pending?.resolve([])
            self.pending = nil
            self.pendingId = 0
          }
        }
      }
    }

    // Resolves a chosen suggestion into a full, single-line postal address
    // (including ZIP). Falls back to "title, subtitle" if MapKit can't resolve it.
    AsyncFunction("resolveAddress") { (title: String, subtitle: String, promise: Promise) in
      DispatchQueue.main.async {
        let request: MKLocalSearch.Request
        // JS receives country-stripped subtitles, so compare against the same.
        if let match = self.lastResults.first(where: { $0.title == title && Self.stripCountry($0.subtitle) == subtitle }) {
          request = MKLocalSearch.Request(completion: match)
        } else {
          request = MKLocalSearch.Request()
          request.naturalLanguageQuery = subtitle.isEmpty ? title : "\(title) \(subtitle)"
        }

        let fallback = subtitle.isEmpty ? title : "\(title), \(subtitle)"
        MKLocalSearch(request: request).start { response, _ in
          guard let placemark = response?.mapItems.first?.placemark else {
            promise.resolve(fallback)
            return
          }
          promise.resolve(Self.format(placemark) ?? fallback)
        }
      }
    }
  }

  private func handleResults(_ completions: [MKLocalSearchCompletion]) {
    lastResults = completions
    fulfill(completions.map { ["title": $0.title, "subtitle": Self.stripCountry($0.subtitle)] })
  }

  private func fulfill(_ results: [[String: String]]) {
    pending?.resolve(results)
    pending = nil
    pendingId = 0
  }

  private static func format(_ placemark: MKPlacemark) -> String? {
    guard let postal = placemark.postalAddress else {
      return placemark.title.map(stripCountry)
    }
    let regionLine = [postal.state, postal.postalCode]
      .filter { !$0.isEmpty }
      .joined(separator: " ")
    // Country omitted on purpose — this app is US-only.
    return [postal.street, postal.city, regionLine]
      .filter { !$0.isEmpty }
      .joined(separator: ", ")
  }

  // Drop a trailing country so US-only addresses read cleanly (e.g. no
  // ", United States" tail on the field or the suggestion subtitles).
  private static func stripCountry(_ s: String) -> String {
    for suffix in [", United States of America", ", United States"] {
      if s.hasSuffix(suffix) {
        return String(s.dropLast(suffix.count))
      }
    }
    return s
  }
}

// MKLocalSearchCompleterDelegate must be an NSObject; keep it separate from the
// Expo Module class (which isn't an NSObject subclass).
private final class CompleterDelegate: NSObject, MKLocalSearchCompleterDelegate {
  private let onResults: ([MKLocalSearchCompletion]) -> Void
  private let onError: () -> Void

  init(onResults: @escaping ([MKLocalSearchCompletion]) -> Void, onError: @escaping () -> Void) {
    self.onResults = onResults
    self.onError = onError
  }

  func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
    onResults(completer.results)
  }

  func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
    onError()
  }
}
