import { ImportExportExcel } from "../../components/ImportExportExcel";
import { FileSpreadsheet } from "lucide-react";

export function ImportExportPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center border border-white/10">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Import / Export Excel
            </h1>
            <p className="text-white/50 mt-0.5">
              Kelola data order secara massal menggunakan file Excel
            </p>
          </div>
        </div>
      </div>

      <ImportExportExcel />
    </div>
  );
}
