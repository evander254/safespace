import * as React from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Progress } from "./progress"

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const password = typeof value === "string" ? value : ""

    const getStrength = (pass: string) => {
      let strength = 0
      if (pass.length >= 8) strength += 25
      if (/[A-Z]/.test(pass)) strength += 25
      if (/[0-9]/.test(pass)) strength += 25
      if (/[^A-Za-z0-9]/.test(pass)) strength += 25
      return strength
    }

    const strength = getStrength(password)
    
    const strengthColor = 
      strength <= 25 ? "bg-red-500" : 
      strength <= 50 ? "bg-orange-500" : 
      strength <= 75 ? "bg-yellow-500" : 
      "bg-green-500"

    const strengthText = 
      strength === 0 ? "" :
      strength <= 25 ? "Weak" : 
      strength <= 50 ? "Fair" : 
      strength <= 75 ? "Good" : 
      "Strong"

    const criteria = [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "At least one uppercase letter", met: /[A-Z]/.test(password) },
      { label: "At least one number", met: /[0-9]/.test(password) },
      { label: "At least one special character", met: /[^A-Za-z0-9]/.test(password) },
    ]

    return (
      <div className="space-y-2 w-full">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10 h-10 rounded-xl border-border/50 bg-muted/20 focus-visible:ring-primary/20 text-sm", className)}
            ref={ref}
            value={value}
            onChange={onChange}
            {...props}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {showStrength && password.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-muted-foreground/60">Strength</span>
              <span className={cn(
                strength <= 25 ? "text-red-500" : 
                strength <= 50 ? "text-orange-500" : 
                strength <= 75 ? "text-yellow-500" : 
                "text-green-500"
              )}>
                {strengthText}
              </span>
            </div>
            <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", strengthColor)} 
                style={{ width: `${strength}%` }}
              />
            </div>
            <ul className="grid grid-cols-1 gap-1">
              {criteria.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5 text-[10px] font-medium transition-colors">
                  {c.met ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/30" />
                  )}
                  <span className={cn(c.met ? "text-foreground" : "text-muted-foreground/60")}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
