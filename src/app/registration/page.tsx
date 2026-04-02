"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { verifyBusiness } from "@/features/registration/api/verify-business";

const LocationPickerMap = dynamic(
  () =>
    import("@/features/registration/components/location-picker-map").then(
      (module) => module.LocationPickerMap,
    ),
  {
    ssr: false,
  },
);

const registrationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+251|0)?[79]\d{8}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email"),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "Enter valid 9-digit National ID"),
  businessName: z.string().trim().min(1, "Business name is required"),
  businessTIN: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter valid 10-digit TIN number"),
  category: z.string().trim().min(1, "Category is required"),
  description: z.string().trim().min(1, "Description is required"),
  addressLandmark: z.string().trim().min(1, "Address or landmark is required"),
  locationLat: z.number({ error: "Map pin is required" }),
  locationLng: z.number({ error: "Map pin is required" }),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const categories = [
  "Restaurant",
  "Cafe",
  "Retail",
  "Hotel",
  "Clinic",
  "Beauty",
  "Electronics",
  "Other",
];

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

export default function RegistrationPage() {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "verified" | "failed">("idle");
  const [verificationMessage, setVerificationMessage] = useState<string>("");

  const defaultValues = useMemo(
    () => ({
      fullName: "",
      phone: "",
      email: "",
      nationalId: "",
      businessName: "",
      businessTIN: "",
      category: "",
      description: "",
      addressLandmark: "",
      locationLat: null as unknown as number,
      locationLng: null as unknown as number,
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

  const verifyMutation = useMutation({
    mutationFn: verifyBusiness,
    onSuccess: (result) => {
      if (result.isValid) {
        setVerificationStatus("verified");
        setVerificationMessage("Business verification successful!");
      } else {
        setVerificationStatus("failed");
        setVerificationMessage(result.message || "Verification failed. Please check your details.");
      }
    },
    onError: () => {
      setVerificationStatus("failed");
      setVerificationMessage("Unable to verify at this time. Please try again.");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: RegistrationFormValues) => {
      void payload;
      await new Promise((resolve) => {
        setTimeout(resolve, 600);
      });
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
              <SectionTitle number={1} title="Owner Information" subtitle="Verification details." />

              <label className={labelClassName} htmlFor="fullName">
                FULL NAME
              </label>
              <input
                id="fullName"
                placeholder="John Doe"
                className={fieldClassName}
                {...register("fullName")}
              />
              {errors.fullName ? <p className="mt-1 text-sm text-rose-600">{errors.fullName.message}</p> : null}

              <label className={`${labelClassName} mt-5 block`} htmlFor="phone">
                PHONE
              </label>
              <input
                id="phone"
                placeholder="+251..."
                className={fieldClassName}
                {...register("phone")}
              />
              {errors.phone ? <p className="mt-1 text-sm text-rose-600">{errors.phone.message}</p> : null}

              <label className={`${labelClassName} mt-5 block`} htmlFor="email">
                EMAIL
              </label>
              <input
                id="email"
                placeholder="john@example.com"
                className={fieldClassName}
                {...register("email")}
              />
              {errors.email ? <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p> : null}

              <label className={`${labelClassName} mt-5 block`} htmlFor="nationalId">
                NATIONAL ID
              </label>
              <input
                id="nationalId"
                placeholder="123456789 (9 digits)"
                className={fieldClassName}
                {...register("nationalId")}
              />
              {errors.nationalId ? <p className="mt-1 text-sm text-rose-600">{errors.nationalId.message}</p> : null}
              <p className="mt-1 text-xs text-slate-500">Enter your Ethiopian National ID for identity verification</p>

              <div className="my-7 border-t border-slate-200 sm:my-8" />

              <SectionTitle number={2} title="Business Verification" subtitle="Official business documents." />

              <label className={labelClassName} htmlFor="businessName">
                BUSINESS NAME
              </label>
              <input
                id="businessName"
                placeholder="Your Business Name"
                className={fieldClassName}
                {...register("businessName")}
              />
              {errors.businessName ? (
                <p className="mt-1 text-sm text-rose-600">{errors.businessName.message}</p>
              ) : null}

              <label className={`${labelClassName} mt-5 block`} htmlFor="businessTIN">
                BUSINESS TIN
              </label>
              <input
                id="businessTIN"
                placeholder="1234567890 (10 digits)"
                className={fieldClassName}
                {...register("businessTIN")}
              />
              {errors.businessTIN ? (
                <p className="mt-1 text-sm text-rose-600">{errors.businessTIN.message}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">Enter your Ethiopian Tax Identification Number from ERCA</p>

              <div className="my-7 border-t border-slate-200 sm:my-8" />

              <SectionTitle number={3} title="Business Details" subtitle="Service categorization." />

              <label className={`${labelClassName} mt-5 block`} htmlFor="category">
                CATEGORY
              </label>
              <select id="category" className={fieldClassName} {...register("category")}>
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category ? <p className="mt-1 text-sm text-rose-600">{errors.category.message}</p> : null}

              <label className={`${labelClassName} mt-5 block`} htmlFor="description">
                DESCRIPTION
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe your business..."
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                {...register("description")}
              />
              {errors.description ? (
                <p className="mt-1 text-sm text-rose-600">{errors.description.message}</p>
              ) : null}

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

              <label className={`${labelClassName} mt-5 block`} htmlFor="addressLandmark">
                ADDRESS / LANDMARK
              </label>
              <input
                id="addressLandmark"
                placeholder="e.g. Near bole bridge"
                className={fieldClassName}
                {...register("addressLandmark")}
              />
              {errors.addressLandmark ? (
                <p className="mt-1 text-sm text-rose-600">{errors.addressLandmark.message}</p>
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
