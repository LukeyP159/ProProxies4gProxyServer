import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  onAddModem?: () => void;
}

const Header = ({ title, subtitle, onRefresh, onAddModem }: HeaderProps) => {
  return (
    <header className="bg-surface shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          )}
          {onAddModem && (
            <Button
              size="sm"
              onClick={onAddModem}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Modem</span>
            </Button>
          )}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Admin</p>
              <p className="text-xs text-gray-500">admin@server.local</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
