"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpRight, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { usePostApiRegister } from "@/lib/api/endpoints/auth";
import { LocationSelectWithLabel } from "@/app/[locale]/_components/location-select-with-label";
import { AuthCard } from "../_components/auth-card";

const createRegisterSchema = (t: (key: string) => string) => z.object({
  roleCode: z.enum(["CUSTOMER", "OWNER", "SALES"]),
  fullName: z.string().min(2, t("fullNameMin")),
  email: z.string().email(t("emailInvalid")),
  username: z.string().regex(/^[a-zA-Z0-9_.-]{3,30}$/, t("usernameInvalid")).optional().or(z.literal("")),
  password: z.string().min(8, t("passwordMin")),
  confirmPassword: z.string().min(8, t("passwordMin")),
  phone: z.string().min(10, t("phoneInvalid")),
  dateOfBirth: z.string().min(1, t("dobRequired")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  provinceId: z.string().optional().or(z.literal("")),
  wardId: z.string().optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: t("passwordMismatch"),
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const REGISTER_ROLES = useMemo(() => [
    { value: "CUSTOMER", label: t("roleCustomer"), description: t("roleCustomerDesc") },
    { value: "OWNER", label: t("roleOwner"), description: t("roleOwnerDesc") },
    { value: "SALES", label: t("roleSales"), description: t("roleSalesDesc") },
  ] as const, [t]);

  const GENDERS = useMemo(() => [
    { value: "MALE", label: t("genderMale") },
    { value: "FEMALE", label: t("genderFemale") },
    { value: "OTHER", label: t("genderOther") },
  ] as const, [t]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { roleCode: "CUSTOMER" },
  });

  const selectedRole = watch("roleCode");
  const selectedGender = watch("gender");
  const selectedProvinceId = watch("provinceId");
  const selectedWardId = watch("wardId");

  const { mutate: registerAccount, isPending } = usePostApiRegister({
    mutation: {
      onSuccess: (_res: unknown, variables: { data: { email: string } }) => {
        router.push(`/verify-otp?email=${encodeURIComponent(variables.data.email)}`);
      },
      onError: (err: any) => {
        const errorMessage = err?.response?.data?.error?.message?.[0] || t("genericError");
        setError(errorMessage);
      },
    },
  });

  const onSubmit = async (formData: RegisterFormData) => {
    setError(null);

    registerAccount({
      data: {
        roleCode: formData.roleCode,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        ...(formData.username ? { username: formData.username } : {}),
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        ...(formData.gender ? { gender: formData.gender } : {}),
        ...(formData.provinceId ? { provinceId: formData.provinceId } : {}),
        ...(formData.wardId ? { wardId: formData.wardId } : {}),
      },
    });
  };

  return (
    <AuthCard
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      className="max-w-5xl"
      backHref="/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── Cột trái: Chọn vai trò (dọc, có chỗ cho vai trò tương lai) ── */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <Label className="text-[13px] font-medium">{t("roleQuestion")}</Label>
          <div className="flex flex-col gap-2.5">
            {REGISTER_ROLES.map((role) => {
              const isActive = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setValue("roleCode", role.value, { shouldDirty: true })}
                  className={
                    "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-300 " +
                    (isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-surface hover:border-foreground-muted hover:bg-surface-muted/40")
                  }
                  aria-pressed={isActive}
                >
                  <span
                    className={
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors " +
                      (isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong text-transparent group-hover:border-foreground-muted")
                    }
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className={"text-sm font-semibold " + (isActive ? "text-primary" : "text-foreground")}>
                      {role.label}
                    </span>
                    <span className="text-[11px] leading-snug text-foreground-muted">
                      {role.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {errors.roleCode && (
            <p className="text-xs text-accent-red-text">{errors.roleCode.message}</p>
          )}
        </div>

        {/* ── Cột phải: Thông tin đăng ký — grid 2 cột nội bộ để gọn ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName" className="text-[13px] font-medium">{t("fullName")} <span className="ml-0.5 text-accent-red-text">*</span></Label>
            <Input
              id="fullName"
              type="text"
              placeholder={t("fullNamePlaceholder")}
              autoComplete="name"
              {...register("fullName")}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName && (
              <p id="fullName-error" className="text-xs text-accent-red-text">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[13px] font-medium">{t("email")} <span className="ml-0.5 text-accent-red-text">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-accent-red-text">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username" className="text-[13px] font-medium">{t("username")}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t("usernamePlaceholder")}
              autoComplete="username"
              {...register("username")}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username && (
              <p id="username-error" className="text-xs text-accent-red-text">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-[13px] font-medium">{t("phone")} <span className="ml-0.5 text-accent-red-text">*</span></Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("phonePlaceholder")}
              autoComplete="tel"
              {...register("phone")}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="text-xs text-accent-red-text">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dateOfBirth" className="text-[13px] font-medium">{t("dateOfBirth")} <span className="ml-0.5 text-accent-red-text">*</span></Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register("dateOfBirth")}
              aria-invalid={!!errors.dateOfBirth}
              aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
            />
            {errors.dateOfBirth && (
              <p id="dateOfBirth-error" className="text-xs text-accent-red-text">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[13px] font-medium">{t("gender")}</Label>
            <Select
              value={selectedGender ?? ""}
              onValueChange={(v) => setValue("gender", v as RegisterFormData["gender"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("genderPlaceholder")}>
                  {GENDERS.find((gender) => gender.value === selectedGender)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value} label={g.label}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-xs text-accent-red-text">{errors.gender.message}</p>
            )}
          </div>

          {/* Địa chỉ: chiếm trọn 1 hàng, tỉnh + phường nằm ngang */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label className="text-[13px] font-medium">{t("address")}</Label>
            <LocationSelectWithLabel
              provinceId={selectedProvinceId || null}
              wardId={selectedWardId || null}
              onProvinceChange={(id) => setValue("provinceId", id ?? "")}
              onWardChange={(id) => setValue("wardId", id ?? "")}
              wardPlaceholder={t("wardPlaceholder")}
              provincePlaceholder={t("provincePlaceholder")}
              horizontal
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="password" className="text-[13px] font-medium">{t("password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordHint")}
                autoComplete="new-password"
                className="pr-11"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted transition-colors duration-300 hover:text-foreground"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-accent-red-text">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="confirmPassword" className="text-[13px] font-medium">{t("confirmPassword")}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder={t("confirmPasswordPlaceholder")}
                autoComplete="new-password"
                className="pr-11"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted transition-colors duration-300 hover:text-foreground"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-xs text-accent-red-text">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-accent-red/20 px-4 py-3 text-sm text-accent-red-text sm:col-span-2"
            >
              {error}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="mt-1 w-full sm:col-span-2" size="lg">
            {isPending ? t("registering") : t("register")}
          </Button>

          <div className="text-center sm:col-span-2">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              <span>{t("haveAccountLogin")}</span>
              <span className="inline-flex size-6 items-center justify-center rounded-lg bg-surface-muted transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight size={12} />
              </span>
            </Link>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
