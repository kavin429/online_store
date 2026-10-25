"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, ShoppingBag } from "lucide-react";

import { Button } from "@online-store/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@online-store/ui/dialog";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: where to send the user after they log in */
  redirectTo?: string;
}

export default function AuthRequiredDialog({
  open,
  onOpenChange,
  redirectTo,
}: AuthRequiredDialogProps) {
  const router = useRouter();

  const loginHref = redirectTo
    ? `/login?callbackUrl=${encodeURIComponent(redirectTo)}`
    : "/login";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl border-fuchsia-100 dark:border-fuchsia-900/40">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-600 to-fuchsia-500 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <DialogTitle className="text-center text-lg">
            Login required
          </DialogTitle>
          <DialogDescription className="text-center">
            Please log in to your GrowMore account to add items to your cart
            or wishlist.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col mt-2">
          <Button
            variant="shoe"
            className="w-full"
            onClick={() => router.push(loginHref)}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Log In
          </Button>

          <Link href="/signup" className="w-full">
            <Button variant="outline" className="w-full">
              Create an account
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}