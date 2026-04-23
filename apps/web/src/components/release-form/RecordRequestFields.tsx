"use client";

import {
  Checkbox,
  SimpleGrid,
  TextInput,
  Textarea,
  Title,
  Stack,
  Group,
  Select,
  Text,
  Tooltip,
  ActionIcon,
  Paper,
  Modal,
} from "@mantine/core";
import { useState } from "react";
import { IconQuestionMark } from "@tabler/icons-react";
import { DatePickerInput } from "@mantine/dates";
import { useFormContext, Controller } from "react-hook-form";
import type { ReleaseFormData } from "@/types/release";

const PURPOSE_OPTIONS = [
  { value: "Continuing care", label: "Continuing care" },
  { value: "Personal records", label: "Personal records" },
  { value: "Insurance/legal", label: "Insurance/legal" },
  { value: "Other", label: "Other" },
];

function HoverHint({ title, label }: { title: string; label: string }) {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Modal opened={opened} onClose={() => setOpened(false)} title={title} size="md">
        <Text size="sm">{label}</Text>
      </Modal>
      <Tooltip label="Click for more info" withArrow>
        <ActionIcon variant="subtle" color="gray" size="xs" radius="xl" onClick={() => setOpened(true)}>
          <IconQuestionMark size={12} />
        </ActionIcon>
      </Tooltip>
    </>
  );
}

interface Props {
  index: number;
}

export default function RecordRequestFields({ index }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ReleaseFormData>();

  const providerType = watch(`providers.${index}.providerType`);
  const specificRecords = watch(`providers.${index}.specificRecords`);
  const otherNonSpecific = watch(`providers.${index}.otherNonSpecific`);
  const sensitiveOther = watch(`providers.${index}.sensitiveOther`);
  const allAvailableDates = watch(`providers.${index}.allAvailableDates`);
  const purpose = watch(`providers.${index}.purpose`);
  const providerErrors = errors.providers?.[index];

  const isInsurance = providerType === "Insurance";
  const isHospitalOrClinic = providerType === "Hospital" || providerType === "Facility";

  return (
    <Paper withBorder p="md" radius="md" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: "none" }}>
    <Stack gap="sm">
      <Title order={6}>Records to Release <span style={{ color: "var(--mantine-color-error)" }}>*</span></Title>

      {isInsurance && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Controller
            name={`providers.${index}.benefitsCoverage`}
            control={control}
            render={({ field }) => (
              <Group gap="xs" align="center" wrap="nowrap">
                <Checkbox label="Benefits and Coverage" checked={field.value} onChange={field.onChange} />
                <HoverHint title="Benefits and Coverage" label="Includes details on what the insurance plan pays for." />
              </Group>
            )}
          />
          <Controller
            name={`providers.${index}.claimsPayment`}
            control={control}
            render={({ field }) => (
              <Group gap="xs" align="center" wrap="nowrap">
                <Checkbox label="Claims and Payment" checked={field.value} onChange={field.onChange} />
                <HoverHint title="Claims and Payment" label="Allows agent to discuss specific medical bills, processing status, and payment history." />
              </Group>
            )}
          />
          <Controller
            name={`providers.${index}.eligibilityEnrollment`}
            control={control}
            render={({ field }) => (
              <Group gap="xs" align="center" wrap="nowrap">
                <Checkbox label="Eligibility and Enrollment" checked={field.value} onChange={field.onChange} />
                <HoverHint title="Eligibility and Enrollment" label="Confirms your current status and plan type with your insurance provider." />
              </Group>
            )}
          />
          <Controller
            name={`providers.${index}.financialBilling`}
            control={control}
            render={({ field }) => (
              <Group gap="xs" align="center" wrap="nowrap">
                <Checkbox label="Financial/Billing Information" checked={field.value} onChange={field.onChange} />
                <HoverHint title="Financial/Billing Information" label="Covers premiums and other financial details." />
              </Group>
            )}
          />
        </SimpleGrid>
      )}

      {isHospitalOrClinic && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Controller
            name={`providers.${index}.medicalRecords`}
            control={control}
            render={({ field }) => (
              <Group gap="xs" align="center" wrap="nowrap">
                <Checkbox label="Medical Records" checked={field.value} onChange={field.onChange} />
                <HoverHint title="Medical Records" label={'Progress Notes: The doctor\'s narrative of your visit, symptoms, and observations. Diagnostic Results: Lab reports (blood work), imaging results (X-rays, MRIs, CT scans), and pathology reports. Vital Signs: Your history of blood pressure, weight, heart rate, and temperature. Medication History: A list of currently prescribed drugs and past prescriptions. Immunization Records: Your complete vaccination history.'} />
              </Group>
            )}
          />
          <Controller
            name={`providers.${index}.dentalRecords`}
            control={control}
            render={({ field }) => (
              <Group gap="xs" align="center" wrap="nowrap">
                <Checkbox label="Dental Records" checked={field.value} onChange={field.onChange} />
                <HoverHint title="Dental Records" label={'Dental Charts: A visual map of your mouth showing existing fillings, crowns, bridges, and missing teeth. Periodontal Charts: Measurements of your gum health (the "pocket depths" the hygienist calls out). Radiographs (Imaging): All digital or film X-rays (bitewings, full-mouth series, and Panorex). Treatment Notes: Detailed narratives of every procedure performed, including types of materials used (e.g., "composite resin" vs. "amalgam"). Prescription History: Records of antibiotics, pain relievers, or fluoride treatments prescribed. If you\'ve had major work like braces, implants, or dentures, these are included: Intraoral Photos: High-resolution pictures taken of specific teeth or lesions. Study Models/Impressions: Digital scans or physical molds of your teeth. Treatment Plans: Proposed work that hasn\'t been done yet, including cost estimates and priority levels. Consent Forms: Signed documents where you agreed to specific surgeries or procedures.'} />
              </Group>
            )}
          />
          <Controller
            name={`providers.${index}.otherNonSpecific`}
            control={control}
            render={({ field }) => (
              <Checkbox label="Other Non-Specific" checked={field.value} onChange={field.onChange} />
            )}
          />
        </SimpleGrid>
      )}

      {!isInsurance && !isHospitalOrClinic && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Controller
            name={`providers.${index}.historyPhysical`}
            control={control}
            render={({ field }) => (
              <Checkbox label="History & Physical" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name={`providers.${index}.diagnosticResults`}
            control={control}
            render={({ field }) => (
              <Checkbox label="Diagnostic Results" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name={`providers.${index}.treatmentProcedure`}
            control={control}
            render={({ field }) => (
              <Checkbox label="Treatment/Procedure Notes" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name={`providers.${index}.prescriptionMedication`}
            control={control}
            render={({ field }) => (
              <Checkbox label="Prescription/Medication" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name={`providers.${index}.imagingRadiology`}
            control={control}
            render={({ field }) => (
              <Checkbox label="Imaging/Radiology" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name={`providers.${index}.dischargeSummaries`}
            control={control}
            render={({ field }) => (
              <Checkbox label="Discharge Summaries" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name={`providers.${index}.specificRecords`}
            control={control}
            render={({ field }) => (
              <Checkbox label="Specific Records" checked={field.value} onChange={field.onChange} />
            )}
          />
        </SimpleGrid>
      )}

      {isInsurance && providerErrors?.benefitsCoverage?.message && (
        <Text c="red" size="xs">{providerErrors.benefitsCoverage.message}</Text>
      )}
      {isHospitalOrClinic && providerErrors?.medicalRecords?.message && (
        <Text c="red" size="xs">{providerErrors.medicalRecords.message}</Text>
      )}
      {!isInsurance && !isHospitalOrClinic && providerErrors?.historyPhysical?.message && (
        <Text c="red" size="xs">{providerErrors.historyPhysical.message}</Text>
      )}

      {!isInsurance && !isHospitalOrClinic && specificRecords && (
        <Textarea
          label="Specific Records Description"
          placeholder="Describe specific records needed..."
          error={providerErrors?.specificRecordsDesc?.message}
          {...register(`providers.${index}.specificRecordsDesc`)}
        />
      )}

      {isHospitalOrClinic && otherNonSpecific && (
        <Textarea
          label="Other Non-Specific Details"
          placeholder="Provide details..."
          error={providerErrors?.otherNonSpecificDesc?.message}
          {...register(`providers.${index}.otherNonSpecificDesc`)}
        />
      )}

      {(isInsurance || isHospitalOrClinic) && (
        <>
          <Title order={6} mt="sm">Sensitive Information to be Disclosed</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Controller
              name={`providers.${index}.sensitiveCommDiseases`}
              control={control}
              render={({ field }) => (
                <Group gap="xs" align="center" wrap="nowrap">
                  <Checkbox label="Communicable Diseases" checked={field.value} onChange={field.onChange} />
                  <HoverHint title="Communicable Diseases" label="Communicable diseases, or infectious diseases, are illnesses caused by pathogens (viruses, bacteria, fungi, parasites) that spread from person to person, through contaminated food/water, surfaces, or insects. Common examples include COVID-19, influenza, tuberculosis, hepatitis, and STIs." />
                </Group>
              )}
            />
            <Controller
              name={`providers.${index}.sensitiveReproductiveHealth`}
              control={control}
              render={({ field }) => (
                <Group gap="xs" align="center" wrap="nowrap">
                  <Checkbox label="Reproductive Health" checked={field.value} onChange={field.onChange} />
                  <HoverHint title="Reproductive Health" label={'Contraception: Birth control, including emergency contraception (the "morning-after pill"). Pregnancy & Related Conditions: Prenatal care, miscarriage management, treatment for ectopic pregnancies, and pregnancy termination. Fertility Services: Infertility diagnoses and assisted reproductive technology like IVF. Other Reproductive Care: Diagnosis/treatment for menopause, endometriosis, and even routine screenings like mammograms.'} />
                </Group>
              )}
            />
            <Controller
              name={`providers.${index}.sensitiveHivAids`}
              control={control}
              render={({ field }) => (
                <Checkbox label="HIV/AIDS status or testing results" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name={`providers.${index}.sensitiveMentalHealth`}
              control={control}
              render={({ field }) => (
                <Checkbox label="Mental Health / Behavior Health records" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name={`providers.${index}.sensitiveSubstanceUse`}
              control={control}
              render={({ field }) => (
                <Checkbox label="Substance Use Disorder (Alcohol/Drug treatment)" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name={`providers.${index}.sensitivePsychotherapy`}
              control={control}
              render={({ field }) => (
                <Checkbox label="Psychotherapy Notes" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name={`providers.${index}.sensitiveOther`}
              control={control}
              render={({ field }) => (
                <Checkbox label="Other (Specify)" checked={field.value} onChange={field.onChange} />
              )}
            />
          </SimpleGrid>
          {sensitiveOther && (
            <TextInput
              label="Provide details"
              placeholder="Specify..."
              {...register(`providers.${index}.sensitiveOtherDesc`)}
            />
          )}
        </>
      )}

      <Title order={6} mt="sm">
        Date Range <span style={{ color: "var(--mantine-color-error)" }}>*</span>
      </Title>
      <Controller
        name={`providers.${index}.allAvailableDates`}
        control={control}
        render={({ field }) => (
          <Checkbox
            label="All available dates"
            checked={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {!allAvailableDates && (
        <Group>
          <Controller
            name={`providers.${index}.dateRangeFrom`}
            control={control}
            render={({ field }) => (
              <DatePickerInput
                label="From"
                placeholder="MM/DD/YYYY"
                popoverProps={{ withinPortal: true, zIndex: 300 }}
                error={providerErrors?.dateRangeFrom?.message}
                value={field.value && !isNaN(Date.parse(field.value)) ? new Date(field.value) : null}
                onChange={(date) =>
                  field.onChange(
                    date
                      ? date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
                      : ""
                  )
                }
              />
            )}
          />
          <Controller
            name={`providers.${index}.dateRangeTo`}
            control={control}
            render={({ field }) => (
              <DatePickerInput
                label="To"
                placeholder="MM/DD/YYYY"
                popoverProps={{ withinPortal: true, zIndex: 300 }}
                error={providerErrors?.dateRangeTo?.message}
                value={field.value && !isNaN(Date.parse(field.value)) ? new Date(field.value) : null}
                onChange={(date) =>
                  field.onChange(
                    date
                      ? date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
                      : ""
                  )
                }
              />
            )}
          />
        </Group>
      )}

      <Controller
        name={`providers.${index}.purpose`}
        control={control}
        render={({ field }) => (
          <Select
            label="Purpose of Release"
            placeholder="Select purpose"
            data={PURPOSE_OPTIONS}
            value={field.value || null}
            onChange={field.onChange}
            allowDeselect={false}
            error={providerErrors?.purpose?.message}
            withAsterisk
          />
        )}
      />
      {purpose === "Other" && (
        <TextInput
          label="Other purpose"
          placeholder="Describe the purpose..."
          error={providerErrors?.purposeOther?.message}
          {...register(`providers.${index}.purposeOther`)}
        />
      )}
    </Stack>
    </Paper>
  );
}
