import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { Separator } from '@shared/ui/separator';
import { useSendInvite, useGenerateInviteLink } from '@entities/workspace';
import { Loader2, CheckCircle2, AlertCircle, Plus, X, Link as LinkIcon, Copy, Check } from 'lucide-react';
import type { Workspace } from "@shared/types";
import type { AxiosError } from 'axios';

interface InviteMemberDialogProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  workspace,
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const [invites, setInvites] = useState([{ email: '', role: 'member' }]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const sendInvite = useSendInvite(workspace.slug);
  const generateLink = useGenerateInviteLink(workspace.slug);

  const resetState = () => {
    setInvites([{ email: '', role: 'member' }]);
    setSuccessMsg('');
    setErrorMsg('');
    setGeneratedLink('');
    setCopied(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const addInvite = () => {
    setInvites([...invites, { email: '', role: 'member' }]);
  };

  const updateInvite = (index: number, field: 'email' | 'role', value: string) => {
    const newInvites = [...invites];
    newInvites[index][field] = value;
    setInvites(newInvites);
  };

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const handleGenerateLink = async () => {
    try {
      const { url } = await generateLink.mutateAsync();
      setGeneratedLink(url);
    } catch {
      setErrorMsg('Failed to generate link');
    }
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validInvites = invites.filter(inv => inv.email.trim());
    if (validInvites.length === 0) return;

    setSuccessMsg('');
    setErrorMsg('');

    try {
      await sendInvite.mutateAsync({ invites: validInvites });
      setSuccessMsg(`Successfully sent ${validInvites.length} invitation(s).`);
      setTimeout(() => handleOpenChange(false), 2000);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMsg(error.response?.data?.message || 'Failed to send invitations. Please try again.');
    }
  };

  const hasEmptyOrSending = invites.every(inv => !inv.email.trim()) || sendInvite.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team</DialogTitle>
          <DialogDescription>Add members to your workspace</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Status messages */}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Invite rows */}
          <div className="flex flex-col gap-3">
            {invites.map((invite, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={invite.email}
                  onChange={(e) => updateInvite(index, 'email', e.target.value)}
                  className="flex-1"
                  required
                />
                <Select
                  value={invite.role}
                  onValueChange={(value) => updateInvite(index, 'role', value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                {index > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeInvite(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="h-9 w-9 shrink-0" />
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addInvite}
          >
            <Plus className="mr-2 h-4 w-4" /> Add another
          </Button>

          <Separator />

          {/* Invite link section */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-link">Or share invite link</Label>
            
            {generatedLink ? (
              <div className="flex w-full">
                <Input 
                  id="invite-link"
                  readOnly 
                  value={generatedLink} 
                  className="flex-1 rounded-r-none focus-visible:z-10" 
                />
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline" 
                  className="shrink-0 rounded-l-none border-l-0 bg-muted/50 hover:bg-muted" 
                  onClick={copyLink}
                  aria-label="Copy link"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                onClick={handleGenerateLink}
                disabled={generateLink.isPending}
              >
                {generateLink.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="mr-2 h-4 w-4" />
                )}
                Generate Link
              </Button>
            )}
          </div>

          <DialogFooter className="mt-2 sm:justify-stretch">
            <Button
              type="submit"
              className="w-full"
              disabled={hasEmptyOrSending}
            >
              {sendInvite.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Invites
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}