"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { OwnerAppShell } from "@/features/owner/components/owner-app-shell";
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

/* ── Zod schema ── */
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

/* ── Step definitions ── */
const STEPS = [
  { id: 1, label: "Owner Verification",  short: "Owner"    },
  { id: 2, label: "Business Verification", short: "Business" },
  { id: 3, label: "Business Details",    short: "Details"  },
  { id: 4, label: "Service Location",    short: "Location" },
] as const;

/* ── Step indicator ── */
function StepIndicator({
  current,
  total,
  steps,
}: {
  current: number;
  total: number;
  steps: typeof STEPS;
}) {
  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      marginBottom:   "32px",
      overflowX:      "auto",
      paddingBottom:  "4px",
    }}>
      {steps.map((step, idx) => {
        const done    = step.id < current;
        const active  = step.id === current;
        const pending = step.id > current;

        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center", flex: idx < total - 1 ? 1 : "none" }}>
            {/* Step node */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", minWidth: "80px" }}>
              <div style={{
                width:           "28px",
                height:          "28px",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                fontFamily:      "var(--font-sans)",
                fontWeight:      700,
                fontSize:        "11px",
                background:      done ? "var(--accent)" : active ? "var(--accent-dim)" : "var(--bg3)",
                color:           done ? "var(--bg)" : active ? "var(--accent)" : "var(--text3)",
                border:          active ? "1.5px solid var(--accent)" : done ? "none" : "1px solid var(--border)",
                transition:      "all 150ms",
              }}>
                {done ? "✓" : step.id}
              </div>
              <span style={{
                fontFamily:    "var(--font-sans)",
                fontSize:      "10px",
                fontWeight:    active ? 600 : 400,
                color:         active ? "var(--text)" : done ? "var(--accent)" : "var(--text3)",
                whiteSpace:    "nowrap",
                textAlign:     "center",
              }}>
                {step.short}
              </span>
            </div>

            {/* Connector line */}
            {idx < total - 1 && (
              <div style={{
                flex:            1,
                height:          "1px",
                background:      done ? "var(--accent)" : "var(--border)",
                margin:          "0 4px",
                marginBottom:    "20px",
                transition:      "background 150ms",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── File upload field ── */
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

/* ── Nav buttons ── */
function StepNav({
  step,
  total,
  onBack,
  onNext,
  isSubmitting,
  isLastStep,
}: {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
}) {
  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      marginTop:      "32px",
      paddingTop:     "20px",
      borderTop:      "1px solid var(--border)",
    }}>
      <button
        type="button"
        onClick={onBack}
        className="tx-btn-ghost"
        style={{ visibility: step === 1 ? "hidden" : "visible" }}
      >
        ← Back
      </button>

      {isLastStep ? (
        <button
          type="submit"
          disabled={isSubmitting}
          className="tx-btn-primary"
          style={{ height: "40px", minWidth: "180px", fontSize: "13px" }}
        >
          {isSubmitting ? "Submitting…" : "Submit Application"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="tx-btn-primary"
          style={{ height: "40px", minWidth: "140px", fontSize: "13px" }}
        >
          Continue →
        </button>
      )}
    </div>
  );
}

/* ── Page ── */
export default function RegistrationPage() {
  return (
    <ProtectedRoute>
      <RegistrationForm />
    </ProtectedRoute>
  );
}

function RegistrationForm() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useSessionStore((s) => s.accessToken);

  const [step,          setStep]          = useState(1);
  const [govIdPreview,  setGovIdPreview]  = useState<string | null>(null);
  const [licPreview,    setLicPreview]    = useState<string | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["business-categories"],
    queryFn:  getBusinessCategories,
  });

  const defaultValues = useMemo(() => ({
    business_name:           "",
    category_id:             "",
    government_id_fan:       "",
    business_licence_number: "",
    government_id_photo:     undefined as unknown as File,
    business_license_photo:  undefined as unknown as File,
    locationLat:             null as unknown as number,
    locationLng:             null as unknown as number,
  }), []);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver:      zodResolver(registrationSchema),
    defaultValues,
    mode:          "onTouched",
  });

  /* Fields validated per step */
  const stepFields: Record<number, (keyof RegistrationFormValues)[]> = {
    1: ["government_id_fan", "business_licence_number", "government_id_photo"],
    2: ["business_name", "business_license_photo"],
    3: ["category_id"],
    4: ["locationLat", "locationLng"],
  };

  async function handleNext() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

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
    <OwnerAppShell width="medium">
      {/* Page title */}
      <div style={{ marginBottom: "28px" }}>
        <p className="tx-section-header" style={{ marginBottom: "6px" }}>Onboarding</p>
        <h1 className="tx-page-title">New Business Application</h1>
        <p className="tx-page-desc" style={{ marginTop: "6px" }}>
          Complete all steps to submit your business for admin review.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} total={STEPS.length} steps={STEPS} />

      {/* Step content panel */}
      <div className="tx-panel" style={{ padding: "28px 24px" }}>
        <form onSubmit={handleSubmit((v) => submitMutation.mutate(v))}>

          {/* ── Step 1: Owner Verification ── */}
          {step === 1 && (
            <div>
              <p className="tx-panel-title" style={{ marginBottom: "4px" }}>Owner Verification</p>
              <p className="tx-sub-label" style={{ marginBottom: "20px" }}>Identity and tax documents.</p>

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

              <label className="tx-label block mt-5 mb-1.5" htmlFor="business_licence_number">
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
            </div>
          )}

          {/* ── Step 2: Business Verification ── */}
          {step === 2 && (
            <div>
              <p className="tx-panel-title" style={{ marginBottom: "4px" }}>Business Verification</p>
              <p className="tx-sub-label" style={{ marginBottom: "20px" }}>Official business documents.</p>

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
                    previewUrl={licPreview}
                    onChange={(file) => {
                      field.onChange(file);
                      setLicPreview(URL.createObjectURL(file));
                    }}
                  />
                )}
              />
            </div>
          )}

          {/* ── Step 3: Business Details ── */}
          {step === 3 && (
            <div>
              <p className="tx-panel-title" style={{ marginBottom: "4px" }}>Business Details</p>
              <p className="tx-sub-label" style={{ marginBottom: "20px" }}>Service categorization.</p>

              <label className="tx-label block mb-1.5" htmlFor="category_id">
                Category
              </label>
              <select
                id="category_id"
                className={`tx-select${errors.category_id ? " error" : ""}`}
                {...register("category_id")}
              >
                <option value="">
                  {categoriesLoading ? "Loading categories…" : "Select a category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                  {errors.category_id.message}
                </p>
              )}
            </div>
          )}

          {/* ── Step 4: Service Location ── */}
          {step === 4 && (
            <div>
              <p className="tx-panel-title" style={{ marginBottom: "4px" }}>Service Location</p>
              <p className="tx-sub-label" style={{ marginBottom: "20px" }}>
                Pin your exact business location on the map.
              </p>

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
                  Please click the map to pin your location
                </p>
              )}

              {/* Submission error */}
              {submitMutation.isError && (
                <div className="mt-4 tx-alert tx-alert-error">
                  {(submitMutation.error as Error).message || "Submission failed. Please try again."}
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <StepNav
            step={step}
            total={STEPS.length}
            onBack={handleBack}
            onNext={handleNext}
            isSubmitting={submitMutation.isPending}
            isLastStep={step === STEPS.length}
          />
        </form>
      </div>
    </OwnerAppShell>
  );
}
