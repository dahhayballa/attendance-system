import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Card from '../../../shared/components/ui/Card';
import Button from '../../../shared/components/ui/Button';
import { UploadCloud, FileText, X, CheckCircle } from 'lucide-react';
import { useWeekUpload } from '../hooks/useWeekUpload';

export interface WeekUploaderProps {
    onUploadComplete?: () => void;
}

export const WeekUploader = ({ onUploadComplete }: WeekUploaderProps) => {
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const weekUploadHook = useWeekUpload();
    const { uploadWeek, isUploading = false, uploadProgress = 0 } = weekUploadHook || {};

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            alert('الرجاء رفع ملف إكسل صالح (.xlsx, .xls)');
            return;
        }
        setSelectedFile(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!selectedFile || !uploadWeek) return;
        const success = await uploadWeek(selectedFile);
        if (success) {
            clearFile();
            onUploadComplete?.();
        }
    };

    return (
        <Card header={<h3 className="text-lg font-bold text-gray-900 pb-2">رفع جدول الأسبوع</h3>}>
            {!selectedFile ? (
                <div
                    className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer'}
          `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleChange}
                    />
                    <UploadCloud className={`mx-auto h-12 w-12 mb-4 transition-colors ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                        اسحب وأفلت ملف الإكسل هنا
                    </p>
                    <p className="text-xs text-gray-500">
                        أو انقر لاختيار ملف (.xlsx, .xls)
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-green-100 text-green-600 p-2.5 rounded-lg flex-shrink-0">
                                <FileText size={24} />
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-medium text-gray-900 truncate" dir="ltr">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                    {Math.round(selectedFile.size / 1024)} KB
                                </p>
                            </div>
                        </div>
                        {!isUploading && (
                            <button
                                onClick={clearFile}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {isUploading && (
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        loading={isUploading}
                        disabled={isUploading || !uploadWeek}
                        fullWidth
                        variant="primary"
                        leftIcon={!isUploading && <CheckCircle size={18} />}
                    >
                        {isUploading ? 'جاري الرفع والمعالجة...' : 'تأكيد ورفع الجدول'}
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default WeekUploader;
