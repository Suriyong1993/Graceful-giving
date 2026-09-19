import { BookOpen, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Illustration } from "@/components/Illustration";
import { offeringCategoryLabel, type OfferingCategory, type ExpenseCategory, OFFERING_CATEGORIES, EXPENSE_CATEGORIES } from "@shared/categories";
import type { SubmittedOffering } from "../types";
import { fmtBaht } from "../utils";

export interface ExpenseFormState {
  title: string;
  amount: string;
  category: ExpenseCategory;
  fundId: string;
  paymentMethod: string;
  notes: string;
}

export interface WithdrawalFormState {
  purpose: string;
  amount: string;
  fundId: string;
  urgency: string;
  notes: string;
}

interface HomeDialogsProps {
  // Offering dialog
  offeringOpen: boolean;
  onOfferingOpenChange: (open: boolean) => void;
  offeringStep: 1 | 2 | 3;
  onOfferingStepChange: (step: 1 | 2 | 3) => void;
  offeringType: OfferingCategory;
  onOfferingTypeChange: (type: OfferingCategory) => void;
  offeringAmount: string;
  onOfferingAmountChange: (v: string) => void;
  offeringFund: string;
  onOfferingFundChange: (v: string) => void;
  offeringMethod: string;
  onOfferingMethodChange: (v: string) => void;
  offeringNotes: string;
  onOfferingNotesChange: (v: string) => void;
  offeringAnon: boolean;
  onOfferingAnonChange: (v: boolean) => void;
  onOfferingSubmit: (e: React.FormEvent) => void;
  createOfferingMutation: { isPending: boolean };

  // Success dialog
  offeringSuccess: boolean;
  onOfferingSuccessChange: (open: boolean) => void;
  submittedOffering: SubmittedOffering | null;

  // Expense dialog
  expenseOpen: boolean;
  onExpenseOpenChange: (open: boolean) => void;
  expenseForm: ExpenseFormState;
  onExpenseFormChange: (form: ExpenseFormState) => void;
  onExpenseSubmit: (e: React.FormEvent) => void;
  createExpenseMutation: { isPending: boolean };

  // Withdrawal dialog
  withdrawalOpen: boolean;
  onWithdrawalOpenChange: (open: boolean) => void;
  withdrawalForm: WithdrawalFormState;
  onWithdrawalFormChange: (form: WithdrawalFormState) => void;
  onWithdrawalSubmit: (e: React.FormEvent) => void;
  createWithdrawalMutation: { isPending: boolean };

  // News sheet
  newsOpen: boolean;
  onNewsOpenChange: (open: boolean) => void;

  // Fund accounts for selects
  fundAccounts: Array<{ id: number; name: string }>;
}

export function HomeDialogs(props: HomeDialogsProps) {
  const {
    offeringOpen, onOfferingOpenChange, offeringStep, onOfferingStepChange,
    offeringType, onOfferingTypeChange, offeringAmount, onOfferingAmountChange,
    offeringFund, onOfferingFundChange, offeringMethod, onOfferingMethodChange,
    offeringNotes, onOfferingNotesChange, offeringAnon, onOfferingAnonChange,
    onOfferingSubmit, createOfferingMutation,
    offeringSuccess, onOfferingSuccessChange, submittedOffering,
    expenseOpen, onExpenseOpenChange, expenseForm, onExpenseFormChange,
    onExpenseSubmit, createExpenseMutation,
    withdrawalOpen, onWithdrawalOpenChange, withdrawalForm, onWithdrawalFormChange,
    onWithdrawalSubmit, createWithdrawalMutation,
    newsOpen, onNewsOpenChange,
    fundAccounts,
  } = props;

  return (
    <>
      <Dialog open={offeringOpen} onOpenChange={onOfferingOpenChange}>
        <DialogContent className="max-w-md bg-[#FFFDF8] border-[#E9D9BF] rounded-[30px] p-6 text-[#38251B]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#EAF5E4] p-1 border border-[#D2EAC7] shrink-0">
                <Illustration src="/illustrations/offering_box.jpg" alt="à¸à¸¥à¹ˆà¸­à¸‡à¸–à¸§à¸²à¸¢" className="w-full h-full object-cover rounded-xl" width={48} height={48} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#70452E]">à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¸–à¸§à¸²à¸¢à¸—à¸£à¸±à¸žà¸¢à¹Œ</DialogTitle>
                <DialogDescription className="text-xs text-[#927D6D]">
                  à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸—à¸µà¹ˆ {offeringStep} à¸ˆà¸²à¸ 3: {offeringStep === 1 ? "à¹€à¸¥à¸·à¸­à¸à¸›à¸£à¸°à¹€à¸ à¸—à¸à¸²à¸£à¸–à¸§à¸²à¸¢" : offeringStep === 2 ? "à¸£à¸°à¸šà¸¸à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™" : "à¹€à¸¥à¸·à¸­à¸à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¹à¸¥à¸°à¸šà¸±à¸™à¸—à¸¶à¸"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {offeringStep === 1 && (
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-[#70452E]">à¸›à¸£à¸°à¹€à¸ à¸—à¸à¸²à¸£à¸–à¸§à¸²à¸¢</label>
              <div className="grid grid-cols-2 gap-2">
                {OFFERING_CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => onOfferingTypeChange(cat.id)} className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${offeringType === cat.id ? "bg-[#FFF4DF] border-[#E99A4A] text-[#70452E] shadow-2xs" : "bg-white border-[#E9D9BF] text-[#70452E]/80 hover:bg-[#FFF9EE]"}`}>
                    {cat.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => onOfferingStepChange(2)} className="w-full mt-4 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow transition-all">
                à¸–à¸±à¸”à¹„à¸›: à¸£à¸°à¸šà¸¸à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™ â†’
              </button>
            </div>
          )}

          {offeringStep === 2 && (
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-[#70452E]">à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™à¸–à¸§à¸²à¸¢ (à¸šà¸²à¸—)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#1b5e3a]">à¸¿</span>
                <input type="number" value={offeringAmount} onChange={e => onOfferingAmountChange(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-[#E9D9BF] text-2xl font-black text-[#1b5e3a] focus:outline-none focus:border-[#E99A4A]" placeholder="0.00" />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[100, 300, 500, 1000, 2000, 5000].map(amt => (
                  <button key={amt} type="button" onClick={() => onOfferingAmountChange(String(amt))} className="px-3 py-1.5 rounded-full bg-[#FFF4DF] border border-[#E9D9BF] text-xs font-bold text-[#70452E] hover:bg-[#FBE9CD]">
                    +à¸¿{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => onOfferingStepChange(1)} className="flex-1 py-3 rounded-2xl bg-[#FFF4DF] text-[#70452E] font-bold text-sm border border-[#E9D9BF]">â† à¸¢à¹‰à¸­à¸™à¸à¸¥à¸±à¸š</button>
                <button type="button" onClick={() => onOfferingStepChange(3)} disabled={!offeringAmount || Number(offeringAmount) <= 0} className="flex-2 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow disabled:opacity-50">à¸–à¸±à¸”à¹„à¸›: à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸–à¸§à¸²à¸¢ â†’</button>
              </div>
            </div>
          )}

          {offeringStep === 3 && (
            <form onSubmit={onOfferingSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1.5 block">à¹€à¸‚à¹‰à¸²à¸à¸­à¸‡à¸—à¸¸à¸™</label>
                <select required value={offeringFund} onChange={e => onOfferingFundChange(e.target.value)} className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs font-medium text-[#38251B]">
                  <option value="" disabled>-- à¹€à¸¥à¸·à¸­à¸à¸à¸­à¸‡à¸—à¸¸à¸™ --</option>
                  {fundAccounts.map(fa => (<option key={fa.id} value={fa.id}>{fa.name}</option>))}
                </select>
                {fundAccounts.length === 0 && (<p className="text-[11px] text-[#D45945] mt-1">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸à¸­à¸‡à¸—à¸¸à¸™à¹ƒà¸™à¸£à¸°à¸šà¸š à¸à¸£à¸¸à¸“à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸à¸­à¸‡à¸—à¸¸à¸™à¸à¹ˆà¸­à¸™à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¸–à¸§à¸²à¸¢</p>)}
              </div>
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1.5 block">à¸§à¸´à¸˜à¸µà¸à¸²à¸£à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™</label>
                <div className="grid grid-cols-2 gap-2">
                  {["à¹€à¸‡à¸´à¸™à¸ªà¸”", "à¹‚à¸­à¸™à¸˜à¸™à¸²à¸„à¸²à¸£", "à¸žà¸£à¹‰à¸­à¸¡à¹€à¸žà¸¢à¹Œ / QR", "à¹€à¸Šà¹‡à¸„"].map(m => (
                    <button key={m} type="button" onClick={() => onOfferingMethodChange(m)} className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${offeringMethod === m ? "bg-[#EAF5E4] border-[#A8C978] text-[#4F8B33]" : "bg-white border-[#E9D9BF] text-[#70452E]/80"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1 block">à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡ (à¸–à¹‰à¸²à¸¡à¸µ)</label>
                <input type="text" value={offeringNotes} onChange={e => onOfferingNotesChange(e.target.value)} placeholder="à¹€à¸Šà¹ˆà¸™ à¸‚à¸­à¸šà¸žà¸£à¸°à¸„à¸¸à¸“à¸ªà¸³à¸«à¸£à¸±à¸šà¸ªà¸¸à¸‚à¸ à¸²à¸ž, à¸§à¸±à¸™à¹€à¸à¸´à¸”" className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="anon" checked={offeringAnon} onChange={e => onOfferingAnonChange(e.target.checked)} className="rounded text-[#E99A4A] focus:ring-[#E99A4A]" />
                <label htmlFor="anon" className="text-xs text-[#70452E]">à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¸–à¸§à¸²à¸¢ (à¸–à¸§à¸²à¸¢à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¹€à¸›à¸´à¸”à¹€à¸œà¸¢à¸™à¸²à¸¡)</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => onOfferingStepChange(2)} className="flex-1 py-3 rounded-2xl bg-[#FFF4DF] text-[#70452E] font-bold text-sm border border-[#E9D9BF]">â† à¸¢à¹‰à¸­à¸™à¸à¸¥à¸±à¸š</button>
                <button type="submit" disabled={createOfferingMutation.isPending || !offeringFund} className="flex-2 py-3 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow disabled:opacity-50">
                  {createOfferingMutation.isPending ? "à¸à¸³à¸¥à¸±à¸‡à¸šà¸±à¸™à¸—à¸¶à¸..." : "à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸šà¸±à¸™à¸—à¸¶à¸à¸–à¸§à¸²à¸¢"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>


      {/* â”€â”€â”€ MODAL 2: OFFERING SUCCESS CELEBRATION â”€â”€â”€ */}
      <Dialog open={offeringSuccess} onOpenChange={onOfferingSuccessChange}>
        <DialogContent className="max-w-sm bg-[#FFFDF8] border-[#E9D9BF] rounded-[30px] p-6 text-center text-[#38251B] space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border border-[#E9D9BF] shadow-xs p-1 bg-[#EAF5E4]">
            <Illustration src="/illustrations/income_hand_heart.jpg" alt="à¸–à¸§à¸²à¸¢à¸ªà¸³à¹€à¸£à¹‡à¸ˆ" className="w-full h-full object-cover rounded-2xl" width={80} height={80} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#70452E]">à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¸–à¸§à¸²à¸¢à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§</h3>
            <p className="text-xs text-[#927D6D] mt-1">"à¸‚à¸­à¸žà¸£à¸°à¹€à¸ˆà¹‰à¸²à¸—à¸£à¸‡à¸­à¸§à¸¢à¸žà¸£à¸°à¸žà¸£à¹à¸¥à¸°à¸•à¸­à¸šà¹à¸—à¸™à¸—à¸¸à¸à¸™à¹‰à¸³à¹ƒà¸ˆà¸—à¸µà¹ˆà¸—à¹ˆà¸²à¸™à¹„à¸”à¹‰à¸¡à¸­à¸šà¹ƒà¸«à¹‰à¹€à¸žà¸·à¹ˆà¸­à¸žà¸±à¸™à¸˜à¸à¸´à¸ˆà¸‚à¸­à¸‡à¸žà¸£à¸°à¸­à¸‡à¸„à¹Œ"</p>
          </div>
          {submittedOffering && (
            <div className="p-3.5 rounded-2xl bg-[#FFF4DF] border border-[#E9D9BF] text-xs text-left space-y-1">
              <p><span className="text-[#927D6D]">à¸£à¸²à¸¢à¸à¸²à¸£:</span> <span className="font-bold text-[#70452E]">{offeringCategoryLabel(submittedOffering.type as OfferingCategory)}</span></p>
              <p><span className="text-[#927D6D]">à¸ˆà¸³à¸™à¸§à¸™:</span> <span className="font-black text-[#1b5e3a]">{fmtBaht(submittedOffering.amount)}</span></p>
              <p><span className="text-[#927D6D]">à¸à¸­à¸‡à¸—à¸¸à¸™:</span> <span className="font-medium text-[#70452E]">{submittedOffering.fund}</span></p>
            </div>
          )}
          <button onClick={() => onOfferingSuccessChange(false)} className="w-full py-3 rounded-2xl bg-[#A8C978] hover:bg-[#96C764] text-white font-bold text-sm clay-button-shadow">
            à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢ (à¸ªà¸£à¸£à¹€à¸ªà¸£à¸´à¸à¸žà¸£à¸°à¹€à¸ˆà¹‰à¸²)
          </button>
        </DialogContent>
      </Dialog>

      {/* â”€â”€â”€ MODAL 3: EXPENSE ENTRY DIALOG â”€â”€â”€ */}
      <Dialog open={expenseOpen} onOpenChange={onExpenseOpenChange}>
        <DialogContent className="max-w-md bg-[#FFFDF8] border-[#E9D9BF] rounded-[30px] p-6 text-[#38251B]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#70452E]">à¸šà¸±à¸™à¸—à¸¶à¸à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢à¸„à¸£à¸´à¸ªà¸•à¸ˆà¸±à¸à¸£</DialogTitle>
            <DialogDescription className="text-xs text-[#927D6D]">à¸šà¸±à¸™à¸—à¸¶à¸à¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢à¸žà¸£à¹‰à¸­à¸¡à¸«à¸±à¸à¸¢à¸­à¸”à¸ˆà¸²à¸à¸à¸­à¸‡à¸—à¸¸à¸™à¸—à¸µà¹ˆà¹€à¸à¸µà¹ˆà¸¢à¸§à¸‚à¹‰à¸­à¸‡</DialogDescription>
          </DialogHeader>
          <form onSubmit={onExpenseSubmit} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-bold text-[#70452E] mb-1 block">à¸Šà¸·à¹ˆà¸­à¸£à¸²à¸¢à¸à¸²à¸£à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢</label>
              <input type="text" required value={expenseForm.title} onChange={e => onExpenseFormChange({ ...expenseForm, title: e.target.value })} placeholder="à¹€à¸Šà¹ˆà¸™ à¸„à¹ˆà¸²à¸­à¸¸à¸›à¸à¸£à¸“à¹Œà¸™à¸¡à¸±à¸ªà¸à¸²à¸£, à¸„à¹ˆà¸²à¹„à¸Ÿà¸Ÿà¹‰à¸²" className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs md:text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1 block">à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™ (à¸šà¸²à¸—)</label>
                <input type="number" required value={expenseForm.amount} onChange={e => onExpenseFormChange({ ...expenseForm, amount: e.target.value })} placeholder="0.00" className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs md:text-sm font-bold text-[#c7382d]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1 block">à¸«à¸¡à¸§à¸”à¸«à¸¡à¸¹à¹ˆ</label>
                <select value={expenseForm.category} onChange={e => onExpenseFormChange({ ...expenseForm, category: e.target.value as ExpenseCategory })} className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs">
                  {EXPENSE_CATEGORIES.map(c => (<option key={c.id} value={c.id}>{c.label}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#70452E] mb-1 block">à¸«à¸±à¸à¸ˆà¸²à¸à¸à¸­à¸‡à¸—à¸¸à¸™</label>
              <select required value={expenseForm.fundId} onChange={e => onExpenseFormChange({ ...expenseForm, fundId: e.target.value })} className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs">
                <option value="" disabled>-- à¹€à¸¥à¸·à¸­à¸à¸à¸­à¸‡à¸—à¸¸à¸™ --</option>
                {fundAccounts.map(fa => (<option key={fa.id} value={fa.id}>{fa.name}</option>))}
              </select>
              {fundAccounts.length === 0 && (<p className="text-[11px] text-[#D45945] mt-1">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸à¸­à¸‡à¸—à¸¸à¸™à¹ƒà¸™à¸£à¸°à¸šà¸š à¸à¸£à¸¸à¸“à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸à¸­à¸‡à¸—à¸¸à¸™à¸à¹ˆà¸­à¸™à¸šà¸±à¸™à¸—à¸¶à¸à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢</p>)}
            </div>
            <button type="submit" disabled={createExpenseMutation.isPending || !expenseForm.fundId} className="w-full py-3 mt-2 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow disabled:opacity-50">
              {createExpenseMutation.isPending ? "à¸à¸³à¸¥à¸±à¸‡à¸šà¸±à¸™à¸—à¸¶à¸..." : "à¸šà¸±à¸™à¸—à¸¶à¸à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢"}
            </button>
          </form>
        </DialogContent>
      </Dialog>


      {/* â”€â”€â”€ MODAL 4: WITHDRAWAL REQUEST DIALOG â”€â”€â”€ */}
      <Dialog open={withdrawalOpen} onOpenChange={onWithdrawalOpenChange}>
        <DialogContent className="max-w-md bg-[#FFFDF8] border-[#E9D9BF] rounded-[30px] p-6 text-[#38251B]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#70452E]">à¸¢à¸·à¹ˆà¸™à¸„à¸³à¸‚à¸­à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™ (Withdrawal Request)</DialogTitle>
            <DialogDescription className="text-xs text-[#927D6D]">à¸ªà¹ˆà¸‡à¸„à¸³à¸‚à¸­à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¹€à¸žà¸·à¹ˆà¸­à¹ƒà¸«à¹‰à¸¨à¸´à¸©à¸¢à¸²à¸ à¸´à¸šà¸²à¸¥à¸«à¸£à¸·à¸­à¹€à¸«à¸£à¸±à¸à¸à¸´à¸à¸žà¸´à¸ˆà¸²à¸£à¸“à¸²à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´</DialogDescription>
          </DialogHeader>
          <form onSubmit={onWithdrawalSubmit} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-bold text-[#70452E] mb-1 block">à¸§à¸±à¸•à¸–à¸¸à¸›à¸£à¸°à¸ªà¸‡à¸„à¹Œà¸à¸²à¸£à¹€à¸šà¸´à¸</label>
              <input type="text" required value={withdrawalForm.purpose} onChange={e => onWithdrawalFormChange({ ...withdrawalForm, purpose: e.target.value })} placeholder="à¹€à¸Šà¹ˆà¸™ à¸„à¹ˆà¸²à¸ˆà¸±à¸”à¸„à¹ˆà¸²à¸¢à¸­à¸™à¸¸à¸Šà¸™, à¸„à¹ˆà¸²à¸‹à¹ˆà¸­à¸¡à¹à¸‹à¸¡à¸«à¹‰à¸­à¸‡à¸™à¹‰à¸³" className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs md:text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1 block">à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™ (à¸šà¸²à¸—)</label>
                <input type="number" required value={withdrawalForm.amount} onChange={e => onWithdrawalFormChange({ ...withdrawalForm, amount: e.target.value })} placeholder="0.00" className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#70452E] mb-1 block">à¸„à¸§à¸²à¸¡à¹€à¸£à¹ˆà¸‡à¸”à¹ˆà¸§à¸™</label>
                <select value={withdrawalForm.urgency} onChange={e => onWithdrawalFormChange({ ...withdrawalForm, urgency: e.target.value })} className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs">
                  <option value="normal">à¸›à¸à¸•à¸´ (à¸•à¸²à¸¡à¸£à¸­à¸š)</option>
                  <option value="urgent">à¹€à¸£à¹ˆà¸‡à¸”à¹ˆà¸§à¸™</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#70452E] mb-1 block">à¹€à¸šà¸´à¸à¸ˆà¸²à¸à¸à¸­à¸‡à¸—à¸¸à¸™</label>
              <select required value={withdrawalForm.fundId} onChange={e => onWithdrawalFormChange({ ...withdrawalForm, fundId: e.target.value })} className="w-full p-2.5 rounded-xl bg-white border border-[#E9D9BF] text-xs">
                <option value="" disabled>-- à¹€à¸¥à¸·à¸­à¸à¸à¸­à¸‡à¸—à¸¸à¸™ --</option>
                {fundAccounts.map(fa => (<option key={fa.id} value={fa.id}>{fa.name}</option>))}
              </select>
              {fundAccounts.length === 0 && (<p className="text-[11px] text-[#D45945] mt-1">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸à¸­à¸‡à¸—à¸¸à¸™à¹ƒà¸™à¸£à¸°à¸šà¸š à¸à¸£à¸¸à¸“à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸à¸­à¸‡à¸—à¸¸à¸™à¸à¹ˆà¸­à¸™à¸¢à¸·à¹ˆà¸™à¸„à¸³à¸‚à¸­à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™</p>)}
            </div>
            <button type="submit" disabled={createWithdrawalMutation.isPending || !withdrawalForm.fundId} className="w-full py-3 mt-2 rounded-2xl bg-[#E99A4A] hover:bg-[#DE8640] text-white font-bold text-sm clay-button-shadow disabled:opacity-50">
              {createWithdrawalMutation.isPending ? "à¸à¸³à¸¥à¸±à¸‡à¸ªà¹ˆà¸‡à¸„à¸³à¸‚à¸­..." : "à¸¢à¸·à¹ˆà¸™à¸„à¸³à¸‚à¸­à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* â”€â”€â”€ SHEET: CHURCH NEWS & ANNOUNCEMENTS â”€â”€â”€ */}
      <Sheet open={newsOpen} onOpenChange={onNewsOpenChange}>
        <SheetContent className="bg-[#FFFDF8] border-l border-[#E9D9BF] w-full sm:max-w-md p-6 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-bold text-[#70452E] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#E99A4A]" />
              <span>à¸‚à¹ˆà¸²à¸§à¸ªà¸²à¸£à¹à¸¥à¸°à¸›à¸£à¸°à¸à¸²à¸¨à¸„à¸£à¸´à¸ªà¸•à¸ˆà¸±à¸à¸£</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-[#927D6D]">à¸•à¸´à¸”à¸•à¸²à¸¡à¸à¸´à¸ˆà¸à¸£à¸£à¸¡ à¸žà¸±à¸™à¸˜à¸à¸´à¸ˆ à¹à¸¥à¸°à¸„à¸³à¸žà¸¢à¸²à¸™à¸žà¸£à¸°à¸žà¸£</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FFF4DF] border border-[#E9D9BF] space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E99A4A] text-white">à¸›à¸£à¸°à¸à¸²à¸¨à¸ªà¸³à¸„à¸±à¸</span>
              <h4 className="text-sm font-bold text-[#70452E]">à¸„à¹ˆà¸²à¸¢à¸ªà¸²à¸¡à¸±à¸„à¸„à¸µà¸˜à¸£à¸£à¸¡à¸›à¸£à¸°à¸ˆà¸³à¸›à¸µ 2026</h4>
              <p className="text-xs text-[#38251B] leading-relaxed">à¸‚à¸­à¹€à¸Šà¸´à¸à¸Šà¸§à¸™à¸žà¸µà¹ˆà¸™à¹‰à¸­à¸‡à¸ªà¸¡à¸²à¸Šà¸´à¸à¸—à¸¸à¸à¸—à¹ˆà¸²à¸™à¸£à¹ˆà¸§à¸¡à¸„à¹ˆà¸²à¸¢à¸ªà¸²à¸¡à¸±à¸„à¸„à¸µà¸˜à¸£à¸£à¸¡ à¸§à¸±à¸™à¸—à¸µà¹ˆ 18-20 à¸•.à¸„. à¸™à¸µà¹‰ à¸“ à¸¨à¸¹à¸™à¸¢à¹Œà¸à¸¶à¸à¸­à¸šà¸£à¸¡à¸„à¸£à¸´à¸ªà¹€à¸•à¸µà¸¢à¸™</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#EAF5E4] border border-[#D2EAC7] space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A8C978] text-white">à¸£à¸²à¸¢à¸‡à¸²à¸™à¸žà¸±à¸™à¸˜à¸à¸´à¸ˆ</span>
              <h4 className="text-sm font-bold text-[#4F8B33]">à¹‚à¸„à¸£à¸‡à¸à¸²à¸£à¹à¸ˆà¸à¸–à¸¸à¸‡à¸¢à¸±à¸‡à¸Šà¸µà¸žà¸ªà¸¹à¹ˆà¸Šà¸¸à¸¡à¸Šà¸™à¸£à¸­à¸šà¹‚à¸šà¸ªà¸–à¹Œ</h4>
              <p className="text-xs text-[#38251B] leading-relaxed">à¸„à¸£à¸´à¸ªà¸•à¸ˆà¸±à¸à¸£à¹„à¸”à¹‰à¸ªà¹ˆà¸‡à¸¡à¸­à¸šà¸–à¸¸à¸‡à¸¢à¸±à¸‡à¸Šà¸µà¸žà¸ˆà¸³à¸™à¸§à¸™ 120 à¸Šà¸¸à¸”à¹à¸à¹ˆà¸„à¸£à¸­à¸šà¸„à¸£à¸±à¸§à¸¢à¸²à¸à¹„à¸£à¹‰ à¸‚à¸­à¸šà¸„à¸¸à¸“à¸žà¸£à¸°à¹€à¸ˆà¹‰à¸²à¸ªà¸³à¸«à¸£à¸±à¸šà¸—à¸¸à¸à¸à¸²à¸£à¸–à¸§à¸²à¸¢</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

