Pod::Spec.new do |s|
  s.name           = 'AddressAutocomplete'
  s.version        = '1.0.0'
  s.summary        = 'Native iOS address autocomplete via MapKit MKLocalSearchCompleter'
  s.description    = 'Free, key-less address typeahead backed by Apple MapKit. iOS only.'
  s.author         = 'Zabaca'
  s.homepage       = 'https://veladon.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'MapKit', 'Contacts'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
