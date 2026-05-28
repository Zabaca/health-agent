import { Text } from "@mantine/core";
import { formatDateTimeUS } from "@/lib/dates";

/**
 * Renders a fax log's received time (and the transmission start time, if it
 * differs/exists) formatted for display. Shared across the patient/agent/admin
 * record-detail pages so the format stays consistent.
 */
export default function FaxReceivedTime({
  recvdate,
  starttime,
}: {
  recvdate: string | null | undefined;
  starttime: string | null | undefined;
}) {
  return (
    <Text size="sm">
      {formatDateTimeUS(recvdate)}
      {starttime ? ` (${formatDateTimeUS(starttime)})` : ""}
    </Text>
  );
}
