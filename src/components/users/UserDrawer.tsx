"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Sparkles, User, Shield } from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import { UserResponseDto, CreateUserDto, UpdateUserDto } from "@/types/api.types";
import { userService } from "@/services/userService";
import { useToast } from "@/contexts/ToastContext";

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: UserResponseDto | null;
}

export default function UserDrawer({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}: UserDrawerProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || "");
      setEmail(userToEdit.email || "");
      setPassword("");
      const normalizedRole =
        userToEdit.role?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
      setRole(normalizedRole);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
    }
    setError(null);
    setShowPassword(false);
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please provide both name and email.");
      return;
    }

    if (!userToEdit && (!password || password.length < 8)) {
      setError("Password is required and must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (userToEdit) {
        const payload: UpdateUserDto = {
          name: name.trim(),
          email: email.trim(),
          role,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        await userService.updateUser(userToEdit.id, payload);
        toast.success("User account updated successfully", 200);
      } else {
        const payload: CreateUserDto = {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
        };
        await userService.createUser(payload);
        toast.success("New user created successfully", 201);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string | string[]; error?: string };
        };
        message?: string;
      };
      const statusCode = axiosErr.response?.status || 400;
      const rawMsg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        "Failed to save user. Please verify user details.";
      const errorString = Array.isArray(rawMsg) ? rawMsg.join(", ") : String(rawMsg);
      setError(errorString);
      toast.error(errorString, statusCode);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SlidingDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? "Edit User Account" : "Create User"}
      subtitle="Configure user credentials and access permissions"
      widthClass="w-full sm:max-w-xl md:max-w-2xl lg:max-w-[42vw]"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
            Full Name <span className="text-brand-accent">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Abebe Kebede"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-sm font-semibold text-text-primary transition-all bg-bg-app placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
            Email Address <span className="text-brand-accent">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. abebe@nanacreative.com"
            className="w-full h-12 px-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-sm font-semibold text-text-primary transition-all bg-bg-app font-mono placeholder:text-gray-400"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
            Password {userToEdit ? <span className="text-gray-400 font-normal">(leave blank to keep current)</span> : <span className="text-brand-accent">*</span>}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required={!userToEdit}
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={userToEdit ? "••••••••" : "Minimum 8 characters"}
              className="w-full h-12 pl-4 pr-11 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-sm font-semibold text-text-primary transition-all bg-bg-app font-mono placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-accent transition-colors p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
            Access Role <span className="text-brand-accent">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                role === "USER"
                  ? "border-brand-accent bg-brand-primary/10 text-text-primary shadow-sm"
                  : "border-border-subtle bg-bg-app text-gray-500 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="USER"
                checked={role === "USER"}
                onChange={() => setRole("USER")}
                className="hidden"
              />
              <User className={`w-5 h-5 ${role === "USER" ? "text-brand-accent" : "text-gray-400"}`} />
              <div>
                <p className="text-xs font-bold text-text-primary">Standard User</p>
                <p className="text-[10px] text-gray-400">Regular portal member</p>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                role === "ADMIN"
                  ? "border-brand-accent bg-brand-primary/10 text-text-primary shadow-sm"
                  : "border-border-subtle bg-bg-app text-gray-500 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="ADMIN"
                checked={role === "ADMIN"}
                onChange={() => setRole("ADMIN")}
                className="hidden"
              />
              <Shield className={`w-5 h-5 ${role === "ADMIN" ? "text-brand-accent" : "text-gray-400"}`} />
              <div>
                <p className="text-xs font-bold text-text-primary">Administrator</p>
                <p className="text-[10px] text-gray-400">Full control &amp; management</p>
              </div>
            </label>
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="pt-6 border-t border-border-subtle flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border-subtle text-xs font-bold text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving User...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{userToEdit ? "Update User" : "Create User"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlidingDrawer>
  );
}
