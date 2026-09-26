import { Money } from "@/components/common/money";

export interface HeroProfitProps {
  question: string;
  amount: string;
}

export function HeroProfit({ question, amount }: HeroProfitProps) {
  return (
    <div className="rounded-card bg-primary p-5 text-primary-foreground">
      <p className="text-sm opacity-90">{question}</p>
      <p className="mt-1 text-3xl font-bold">
        <Money amount={amount} className="text-primary-foreground" />
      </p>
    </div>
  );
}
