/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

// lucide-react types (bundled package is missing .d.ts in this install)
declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
    className?: string;
    style?: React.CSSProperties;
    'aria-hidden'?: boolean | 'true' | 'false';
    'aria-label'?: string;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  // Icon exports used in this project
  export const Home: LucideIcon;
  export const Pill: LucideIcon;
  export const Heart: LucideIcon;
  export const Calendar: LucideIcon;
  export const Settings: LucideIcon;
  export const Bell: LucideIcon;
  export const Shield: LucideIcon;
  export const Brain: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const Check: LucideIcon;
  export const X: LucideIcon;
  export const Clock: LucideIcon;
  export const Volume2: LucideIcon;
  export const Phone: LucideIcon;
  export const Printer: LucideIcon;
  export const Share2: LucideIcon;
  export const Plus: LucideIcon;
  export const Edit2: LucideIcon;
  export const Trash2: LucideIcon;
  export const Package: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Activity: LucideIcon;
  export const Users: LucideIcon;
  export const User: LucideIcon;
  export const LogOut: LucideIcon;
  export const Globe: LucideIcon;
  export const Type: LucideIcon;
  export const Sun: LucideIcon;
  export const Moon: LucideIcon;
  export const Zap: LucideIcon;
  export const Link2: LucideIcon;
  export const Download: LucideIcon;
  export const Info: LucideIcon;
  export const FileText: LucideIcon;
  export const CheckSquare: LucideIcon;
  export const MapPin: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Star: LucideIcon;
  export const Trophy: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const BarChart2: LucideIcon;
  export const PieChart: LucideIcon;
  export const LineChart: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Lock: LucideIcon;
  export const Unlock: LucideIcon;
  export const Key: LucideIcon;
  export const Mail: LucideIcon;
  export const BookOpen: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Clipboard: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Stethoscope: LucideIcon;
  export const Syringe: LucideIcon;
  export const Thermometer: LucideIcon;
  export const Droplet: LucideIcon;
  export const BrainCircuit: LucideIcon;
  export const Baby: LucideIcon;
  export const FlaskConical: LucideIcon;
  export const Ambulance: LucideIcon;
  export const HeartPulse: LucideIcon;
  export const Wifi: LucideIcon;
  export const WifiOff: LucideIcon;
  export const CloudOff: LucideIcon;
  export const RotateCw: LucideIcon;
  export const AlertOctagon: LucideIcon;
  export const CheckCheck: LucideIcon;
  export const Minus: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Search: LucideIcon;
  export const Filter: LucideIcon;
  export const SortAsc: LucideIcon;
  export const SortDesc: LucideIcon;
}
