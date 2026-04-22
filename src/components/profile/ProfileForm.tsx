"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextInput,
  Button,
  SimpleGrid,
  Stack,
  Alert,
  Group,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/lib/schemas/profile";
import { apiClient } from "@/lib/api/client";
import AvatarUpload from "@/components/shared/AvatarUpload";
import PageHeader from "@/components/shared/PageHeader";
import ChangePasswordSection from "@/components/shared/ChangePasswordSection";

interface ProfileFormProps {
  defaultValues: ProfileFormData;
  onComplete?: (data: ProfileFormData) => void;
  redirectTo?: string;
  maw?: number | string;
}

export default function ProfileForm({ defaultValues, onComplete, redirectTo, maw = 700 }: ProfileFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const nameForInitials = [firstName, lastName].filter(Boolean).join(" ");

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setSuccess(false);
    setServerError("");

    try {
      const result = await apiClient.profile.update({ body: data });

      if (result.status !== 200) {
        setServerError("Failed to save profile. Please try again.");
      } else if (onComplete) {
        onComplete(data);
      } else if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        setSuccess(true);
        reset(data);
      }
    } catch {
      setServerError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: maw, width: "100%" }}>
    <form onSubmit={handleSubmit(onSubmit)}>
      <PageHeader
        title="My Profile"
        action={<Button type="submit" loading={loading} disabled={!isDirty}>Save Profile</Button>}
      />

      {success && (
        <Alert color="green" mb="md">
          Profile saved successfully.
        </Alert>
      )}
      {serverError && (
        <Alert color="red" mb="md">
          {serverError}
        </Alert>
      )}

      <Stack>
        <Controller
          name="avatarUrl"
          control={control}
          render={({ field }) => (
            <AvatarUpload
              value={field.value}
              onChange={field.onChange}
              name={nameForInitials}
            />
          )}
        />

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <TextInput
            label="First Name"
            required
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <TextInput
            label="Middle Name"
            error={errors.middleName?.message}
            {...register("middleName")}
          />
          <TextInput
            label="Last Name"
            required
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <DatePickerInput
                label="Date of Birth"
                placeholder="MM/DD/YYYY"
                required
                maxDate={new Date()}
                popoverProps={{ withinPortal: true, zIndex: 300 }}
                error={errors.dateOfBirth?.message}
                value={field.value && !isNaN(Date.parse(field.value)) ? new Date(field.value) : null}
                onChange={(date) =>
                  field.onChange(
                    date
                      ? date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
                      : ""
                  )
                }
                styles={{ root: { alignSelf: 'end' } }}
              />
            )}
          />
          <TextInput
            label="Social Security Number (Last 4 digits)"
            placeholder="1234"
            maxLength={4}
            description="Optional — last 4 digits only. Helps verify your identity."
            error={errors.ssn?.message}
            {...register("ssn")}
          />
        </SimpleGrid>

        <TextInput
          label="Address"
          required
          error={errors.address?.message}
          {...register("address")}
        />

        <TextInput
          label="Phone Number"
          required
          error={errors.phoneNumber?.message}
          {...register("phoneNumber")}
        />
      </Stack>
    </form>
    {!onComplete && <ChangePasswordSection />}
    </div>
  );
}
