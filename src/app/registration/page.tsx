"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getBusinessCategories, submitBusinessRegistration } from "@/features/registration/api/registration";
import { useSessionStore } from "@/store/session-store";

const LocationPickerMap = dynamic(
  () =>
    import("@/features/registration/components/location-picker-map").then(
      (module) => module.LocationPickerMap,
    ),
  { ssr: false },
);

const registrationSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required"),
  category_id: z.string().min(1, "Category is required"),
  government_id_fan: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Enter valid 12-digit National ID"),
  business_licence_number: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter valid 10-digit TIN number"),
  government_id_photo: z
    .instanceof(File, { message: "National ID photo is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "File must be under 5MB"),
  business_license_photo: z
    .instanceof(File, { message: "Business license photo is required" })
    .refine((f) => f.size <= 5 * 1024 * 1024, "File must be under 5MB"),
  locationLat: z.number({ error: "Map pin is required" }),
  locationLng: z.number({ error: "Map pin is required" }),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const fieldClassName =
  "mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 sm:text-sm";

const labelClassName = "text-xs font-semibold tracking-[0.14em] text-slate-500";

function SectionTitle({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
        {number}
      </span>
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
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
    <div className="mt-5">
      <p className={labelClassName}>{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition ${
          error ? "border-rose-300 bg-rose-50" : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="h-24 w-auto rounded object-contain" />
        ) : (
          <>
            <span className="text-2xl">📎</span>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
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
      {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

export default function RegistrationPage() {
  const router = useRouter();
  const accessToken = useSessionStore((s) => s.accessToken);
  const [govIdPreview, setGovIdPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["business-categories"],
    queryFn: getBusinessCategories,
  });

  const defaultValues = useMemo(
    () => ({
      business_name: "",
      category_id: "",
      government_id_fan: "",
      business_licence_number: "",
      government_id_photo: undefined as unknown as File,
      business_license_photo: undefined as unknown as File,
      locationLat: null as unknown as number,
      locationLng: null as unknown as number,
    }),
    [],
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
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
          business_name: values.business_name,
          category_id: values.category_id,
          latitude: values.locationLat,
          longitude: values.locationLng,
          government_id_fan: values.government_id_fan,
          business_licence_number: values.business_licence_number,
          government_id_photo_url: governmentIdUrl,
          business_license_photo_url: businessLicenseUrl,
        },
        accessToken ?? "",
      );
    },
    onSuccess: () => {
      router.push("/status");
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-start gap-4 border-b border-slate-200 pb-6">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg text-indigo-700 sm:h-12 sm:w-12 sm:text-xl">
            👤
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">Business Owner Registration</h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Register as a business owner to get started with TaxiMela
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit((values) => submitMutation.mutate(values))} className="pt-6 sm:pt-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <section className="space-y-0">
              <SectionTitle number={1} title="Owner Verification" subtitle="Identity and tax documents." />

              <label className={labelClassName} htmlFor="government_id_fan">
                NATIONAL ID NUMBER
              </label>
              <input
                id="government_id_fan"
                placeholder="123456789012 (12 digits)"
                className={fieldClassName}
                {...register("government_id_fan")}
              />
              {errors.government_id_fan ? <p className="mt-1 text-sm text-rose-600">{errors.government_id_fan.message}</p> : null}
              <p className="mt-1 text-xs text-slate-500">Your Ethiopian National ID number</p>

              <Controller
                control={control}
                name="government_id_photo"
                render={({ field }) => (
                  <FileInput
                    label="NATIONAL ID PHOTO"
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

              <div className="my-7 border-t border-slate-200 sm:my-8" />

              <SectionTitle number={2} title="Business Verification" subtitle="Official business documents." />

              <label className={labelClassName} htmlFor="business_name">
                BUSINESS NAME
              </label>
              <input
                id="business_name"
                placeholder="Your Business Name"
                className={fieldClassName}
                {...register("business_name")}
              />
              {errors.business_name ? <p className="mt-1 text-sm text-rose-600">{errors.business_name.message}</p> : null}

              <label className={`${labelClassName} mt-5 block`} htmlFor="business_licence_number">
                BUSINESS TIN
              </label>
              <input
                id="business_licence_number"
                placeholder="1234567890 (10 digits)"
                className={fieldClassName}
                {...register("business_licence_number")}
              />
              {errors.business_licence_number ? <p className="mt-1 text-sm text-rose-600">{errors.business_licence_number.message}</p> : null}
              <p className="mt-1 text-xs text-slate-500">Your Ethiopian Tax Identification Number from ERCA</p>

              <Controller
                control={control}
                name="business_license_photo"
                render={({ field }) => (
                  <FileInput
                    label="BUSINESS LICENSE PHOTO"
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

              <div className="my-7 border-t border-slate-200 sm:my-8" />

              <SectionTitle number={3} title="Business Details" subtitle="Service categorization." />

              <label className={`${labelClassName} mt-5 block`} htmlFor="category_id">
                CATEGORY
              </label>
              <select id="category_id" className={fieldClassName} {...register("category_id")}>
                <option value="">{categoriesLoading ? "Loading categories..." : "Select Category"}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id ? <p className="mt-1 text-sm text-rose-600">{errors.category_id.message}</p> : null}
            </section>

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
                        onPick={(latitude, longitude) => {
                          latField.onChange(latitude);
                          lngField.onChange(longitude);
                        }}
                      />
                    )}
                  />
                )}
              />

              {errors.locationLat || errors.locationLng ? (
                <p className="mt-2 text-sm text-rose-600">Map pin is required</p>
              ) : null}
            </section>
          </div>

          <div className="sticky bottom-0 mt-8 border-t border-slate-200 bg-white/95 py-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:py-0">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-indigo-600 px-6 text-base font-semibold text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-100 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-0 sm:h-11 sm:w-auto sm:min-w-[220px]"
            >
              {submitMutation.isPending ? "Submitting..." : "Complete Registration"}
            </button>
          </div>

          {submitMutation.isError ? (
            <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {(submitMutation.error as Error).message || "Submission failed. Please try again."}
            </p>
          ) : null}

          {submitMutation.isSuccess ? (
            <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Registration submitted successfully.
            </p>
          ) : null}
        </form>
      </main>
    </div>
  );
}
