"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { OwnerAppShell } from "@/features/owner/components/owner-app-shell";
import { OwnerPageHeader } from "@/features/owner/components/owner-page-header";
import { getBusinessCategories, submitBusinessRegistration } from "@/features/registration/api/registration";
import { OWNER_ACCOUNT_QUERY_KEY } from "@/features/owner/hooks/use-owner-account";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ProtectedRoute } from "@/lib/auth-provider";
import { useSessionStore } from "@/store/session-store";

const LocationPickerMap = dynamic(
  () =>
    import("@/features/registration/components/location-picker-map").then(
      (m) => m.LocationPickerMap,
    ),
  { ssr: false },
);

const registrationSchema = z.object({
  business_name:           z.string().trim().min(1, "Business name is required"),
  category_id:             z.string().min(1, "Category is required"),
  government_id_fan:       z.string().trim().regex(/^\d{12}$/, "Enter valid 12-digit National ID"),
  business_licence_number: z.string().trim().min(1, "Business license number is required"),
  government_id_photo:     z
    .instanceof(File, { message: "National ID photo is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "File must be under 5MB"),
  business_license_photo:  z
    .instanceof(File, { message: "Business license photo is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "File must be under 5MB"),
  locationLat: z.number({ error: "Map pin is required" }),
  locationLng: z.number({ error: "Map pin is required" }),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

function SectionTitle({
  number,
  title,
  subtitle,
}: {
  number: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span
        className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold"
        style={{
          background: "var(--accent-dim)",
          color: "var(--accent)",
          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          borderRadius: 0,
        }}
      >
        {number}
      </span>
      <div>
        <h2 className="tx-panel-title">{title}</h2>
        <p className="tx-sub-label mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function FileInput({
  label,
  hint,
  error,
  onChange,
  previewUrl,
}: {
  label: string;
  hint: string;
  error?: string;
  onChange: (file: File) => void;
  previewUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4">
      <p className="tx-label mb-1.5">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className={`tx-dropzone${error ? " error" : ""}`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="h-20 w-auto object-contain" />
        ) : (
          <>
            <span className="text-xl mb-1" style={{ color: "var(--text3)" }}>↑</span>
            <p className="tx-sub-label text-center">{hint}</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
      />
      {error && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{error}</p>}
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <ProtectedRoute>
      <RegistrationForm />
    </ProtectedRoute>
  );
}

function RegistrationForm() {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const accessToken  = useSessionStore((s) => s.accessToken);
  const [govIdPreview,    setGovIdPreview]    = useState<string | null>(null);
  const [licensePreview,  setLicensePreview]  = useState<string | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["business-categories"],
    queryFn: getBusinessCategories,
  });

  const defaultValues = useMemo(
    () => ({
      business_name:           "",
      category_id:             "",
      government_id_fan:       "",
      business_licence_number: "",
      government_id_photo:     undefined as unknown as File,
      business_license_photo:  undefined as unknown as File,
      locationLat:             null as unknown as number,
      locationLng:             null as unknown as number,
    }),
    [],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues,
  });

  const submitMutation = useMutation({
    mutationFn: async (values: RegistrationFormValues) => {
      const [governmentIdUrl, businessLicenseUrl] = await Promise.all([
        uploadToCloudinary(values.government_id_photo),
        uploadToCloudinary(values.business_license_photo),
      ]);
      return submitBusinessRegistration(
        {
          business_name:              values.business_name,
          category_id:                values.category_id,
          latitude:                   values.locationLat,
          longitude:                  values.locationLng,
          government_id_fan:          values.government_id_fan,
          business_licence_number:    values.business_licence_number,
          government_id_photo_url:    governmentIdUrl,
          business_license_photo_url: businessLicenseUrl,
        },
        accessToken ?? "",
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OWNER_ACCOUNT_QUERY_KEY });
      router.push("/status");
    },
  });

  return (
    <OwnerAppShell width="wide">
      <OwnerPageHeader
        eyebrow="Onboarding"
        title="New Business Application"
        description="Complete all sections below to submit your business for admin review."
        backHref="/status"
        backLabel="Application history"
      />

      <form onSubmit={handleSubmit((values) => submitMutation.mutate(values))}>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">

            {/* ── Left column ── */}
            <section className="space-y-0">

              {/* Section 1 */}
              <SectionTitle number={1} title="Owner Verification" subtitle="Identity and tax documents." />

              <label className="tx-label block mb-1.5" htmlFor="government_id_fan">
                National ID Number
              </label>
              <input
                id="government_id_fan"
                placeholder="123456789012 (12 digits)"
                className={`tx-input${errors.government_id_fan ? " error" : ""}`}
                {...register("government_id_fan")}
              />
              {errors.government_id_fan && (
                <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                  {errors.government_id_fan.message}
                </p>
              )}
              <p className="mt-1 tx-sub-label">Your Ethiopian National ID number</p>

              <label className="tx-label block mt-4 mb-1.5" htmlFor="business_licence_number">
                Business License Number
              </label>
              <input
                id="business_licence_number"
                placeholder="Enter your business license number"
                className={`tx-input${errors.business_licence_number ? " error" : ""}`}
                {...register("business_licence_number")}
              />
              {errors.business_licence_number && (
                <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                  {errors.business_licence_number.message}
                </p>
              )}
              <p className="mt-1 tx-sub-label">Your official business license / TIN number</p>

              <Controller
                control={control}
                name="government_id_photo"
                render={({ field }) => (
                  <FileInput
                    label="National ID Photo"
                    hint="Upload a clear photo of your National ID (JPG, PNG, PDF — max 5MB)"
                    error={errors.government_id_photo?.message}
                    previewUrl={govIdPreview}
                    onChange={(file) => {
                      field.onChange(file);
                      setGovIdPreview(URL.createObjectURL(file));
                    }}
                  />
                )}
              />

              <hr className="tx-divider" />

              {/* Section 2 */}
              <SectionTitle number={2} title="Business Verification" subtitle="Official business documents." />

              <label className="tx-label block mb-1.5" htmlFor="business_name">
                Business Name
              </label>
              <input
                id="business_name"
                placeholder="Your Business Name"
                className={`tx-input${errors.business_name ? " error" : ""}`}
                {...register("business_name")}
              />
              {errors.business_name && (
                <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                  {errors.business_name.message}
                </p>
              )}

              <Controller
                control={control}
                name="business_license_photo"
                render={({ field }) => (
                  <FileInput
                    label="Business License Photo"
                    hint="Upload a clear photo of your Business License (JPG, PNG, PDF — max 5MB)"
                    error={errors.business_license_photo?.message}
                    previewUrl={licensePreview}
                    onChange={(file) => {
                      field.onChange(file);
                      setLicensePreview(URL.createObjectURL(file));
                    }}
                  />
                )}
              />

              <hr className="tx-divider" />

              {/* Section 3 */}
              <SectionTitle number={3} title="Business Details" subtitle="Service categorization." />

              <label className="tx-label block mt-4 mb-1.5" htmlFor="category_id">
                Category
              </label>
              <select
                id="category_id"
                className={`tx-select${errors.category_id ? " error" : ""}`}
                {...register("category_id")}
              >
                <option value="">
                  {categoriesLoading ? "Loading categories…" : "Select Category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                  {errors.category_id.message}
                </p>
              )}
            </section>

            {/* ── Right column ── */}
            <section>
              <SectionTitle number={4} title="Service Location" subtitle="Pin your business on the map." />

              <Controller
                control={control}
                name="locationLat"
                render={({ field: latField }) => (
                  <Controller
                    control={control}
                    name="locationLng"
                    render={({ field: lngField }) => (
                      <LocationPickerMap
                        latitude={Number.isFinite(latField.value) ? latField.value : null}
                        longitude={Number.isFinite(lngField.value) ? lngField.value : null}
                        onPick={(lat, lng) => {
                          latField.onChange(lat);
                          lngField.onChange(lng);
                        }}
                      />
                    )}
                  />
                )}
              />
              {(errors.locationLat || errors.locationLng) && (
                <p className="mt-2 text-xs" style={{ color: "var(--red)" }}>
                  Map pin is required
                </p>
              )}
            </section>
          </div>

          {/* Submit bar */}
          <div className="tx-panel mt-8 flex flex-col items-start gap-4 p-5">
            <p className="tx-sub-label" style={{ fontSize: "12px" }}>
              All fields are required unless marked optional.
            </p>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="tx-btn-primary w-full sm:w-auto"
              style={{ height: "44px", minWidth: "220px", fontSize: "13px" }}
            >
              {submitMutation.isPending ? "Submitting…" : "Submit Application"}
            </button>
          </div>

          {submitMutation.isError && (
            <div className="mt-4 tx-alert tx-alert-error">
              {(submitMutation.error as Error).message || "Submission failed. Please try again."}
            </div>
          )}
        </form>
    </OwnerAppShell>
  );
}
