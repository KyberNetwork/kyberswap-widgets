import { Slider } from "@kyber/ui/slider";
import { cn } from "@kyber/utils/tailwind-helpers";
import { useState } from "react";

export function SourcePoolState() {
  const [percent, setPercent] = useState(0);
  return (
    <div className="flex-1">
      <div className="flex-1 border border-stroke rounded-md px-4 py-3">
        <span className="text-subText text-sm">Liquidity to Remove</span>
        <div className="flex justify-between items-center mt-2 py-1.5">
          <div className="font-medium text-lg">{percent}%</div>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((item) => (
              <button
                key={item}
                className={cn(
                  "w-10 h-6 rounded-full flex items-center justify-center border text-xs font-medium",
                  item === percent
                    ? "bg-primary-20 text-primary border-primary"
                    : "bg-transparent border-stroke  text-subText"
                )}
                onClick={() => setPercent(item)}
              >
                {item === 100 ? "Max" : `${item}%`}
              </button>
            ))}
          </div>
        </div>
        <Slider
          value={[percent]}
          max={100}
          step={1}
          className="mt-3"
          onValueChange={(v) => {
            setPercent(v[0]);
          }}
        />
      </div>

      <div className="flex-1 border border-stroke rounded-md px-4 py-3 mt-4">
        <span className="text-subText text-sm">Claim fee</span>
      </div>
    </div>
  );
}
