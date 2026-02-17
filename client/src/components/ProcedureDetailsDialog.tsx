import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

export interface CaseDetails {
  id: string;
  surgeon: string;
  procedure: string;
  date: string;
  notes: string;
}

interface ProcedureDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: CaseDetails;
  onSave: (details: CaseDetails) => void;
}

export function ProcedureDetailsDialog({ open, onOpenChange, details, onSave }: ProcedureDetailsDialogProps) {
  const [formData, setFormData] = useState<CaseDetails>(details);

  useEffect(() => {
    setFormData(details);
  }, [details, open]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Procedure Details</DialogTitle>
          <DialogDescription>
            Edit the metadata for this surgical case.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="case-id" className="text-right">
              Case ID
            </Label>
            <Input
              id="case-id"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="surgeon" className="text-right">
              Surgeon
            </Label>
            <Input
              id="surgeon"
              value={formData.surgeon}
              onChange={(e) => setFormData({ ...formData, surgeon: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="procedure" className="text-right">
              Procedure
            </Label>
            <Input
              id="procedure"
              value={formData.procedure}
              onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
