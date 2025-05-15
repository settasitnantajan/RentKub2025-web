import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Assuming these are your dialog components
import { Button } from "@/components/ui/button";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to proceed? This action may not be reversible.",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonVariant = "destructive",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">{cancelButtonText}</Button>
          <Button variant={confirmButtonVariant} onClick={onConfirm} className="cursor-pointer">{confirmButtonText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;