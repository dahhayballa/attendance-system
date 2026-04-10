import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Card from '../../../shared/components/ui/Card';
import Button from '../../../shared/components/ui/Button';
import { UploadCloud, FileText, X, CheckCircle } from 'lucide-react';
import { useWeekUpload } from '../hooks/useWeekUpload';
import { useTranslation } from 'react-i18next';

export interface WeekUploaderProps {
    onUploadComplete?: () => void;
}

export const WeekUploader = ({ onUploadComplete }: WeekUploaderProps) => {
    const { t } = useTranslation();
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
            alert(t('admin.dashboard.importError', 'Veuillez importer un fichier Excel valide (.xlsx, .xls)'));
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
        <Card header={<h3 className="text-lg font-bold text-gray-900 pb-2">{t('admin.weeks.uploadTitle')}</h3>}>
            <div dir="ltr">
                {!selectedFile ? (
                    <div
                        className={`
                            border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                            ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer'}
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
                        <UploadCloud className={`mx-auto h-12 w-12 mb-4 transition-colors ${dragActive ? 'text-orange-500' : 'text-gray-400'}`} />
                        <p className="text-sm font-bold text-gray-900 mb-1">
                            {t('admin.dashboard.dragDropPlaceholder', 'Glissez et déposez le fichier Excel ici')}
                        </p>
                        <p className="text-xs font-medium text-gray-500">
                            {t('admin.dashboard.clickSelectPlaceholder', 'ou cliquez pour sélectionner (.xlsx, .xls)')}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="bg-green-100 text-green-600 p-3 rounded-xl flex-shrink-0 shadow-sm border border-green-200">
                                    <FileText size={24} />
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-bold text-gray-900 truncate">{selectedFile.name}</p>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                                        {Math.round(selectedFile.size / 1024)} KB
                                    </p>
                                </div>
                            </div>
                            {!isUploading && (
                                <button
                                    onClick={clearFile}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {isUploading && (
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                                <div className="bg-orange-500 h-2 rounded-full transition-all duration-300 shadow-sm" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}

                        <Button
                            onClick={handleUpload}
                            loading={isUploading}
                            disabled={isUploading || !uploadWeek}
                            fullWidth
                            variant="primary"
                            leftIcon={!isUploading && <CheckCircle size={18} />}
                            className="bg-orange-600 hover:bg-orange-700 text-white border-transparent"
                        >
                            {isUploading ? t('admin.daily.importingLabel') : t('admin.daily.importBtnLabel')}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default WeekUploader;
