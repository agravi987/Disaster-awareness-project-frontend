/**
 * src/components/ImageUpload.jsx - Cloudinary Image Upload Component
 *
 * Props:
 *   value      {string}   - Current image URL (for preview)
 *   onChange   {function} - Called with the new URL after upload
 *   label      {string}   - Optional label text (default: "Thumbnail Image")
 */

import React, { useRef, useState } from 'react';
import { uploadImage } from '../services/api';
import { FiUploadCloud, FiX } from 'react-icons/fi';

function ImageUpload({ value, onChange, label = 'Thumbnail Image' }) {
    const inputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic client-side validation
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPG, PNG, WebP, etc.)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5 MB');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const { data } = await uploadImage(formData);
            onChange(data.url);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Check Cloudinary credentials.');
        } finally {
            setLoading(false);
            // Reset input so the same file can be re-selected if needed
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleClear = () => {
        onChange('');
        setError('');
    };

    return (
        <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                {label}
            </label>

            {/* Preview */}
            {value && (
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
                    <img
                        src={value}
                        alt="Thumbnail preview"
                        style={{ height: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgb(var(--border))' }}
                    />
                    <button
                        type="button"
                        onClick={handleClear}
                        title="Remove image"
                        style={{
                            position: 'absolute', top: '-8px', right: '-8px',
                            background: 'rgb(var(--danger))', color: '#fff',
                            border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '12px',
                        }}
                    >
                        <FiX size={12} />
                    </button>
                </div>
            )}

            {/* Upload button area */}
            <div
                onClick={() => !loading && inputRef.current?.click()}
                className="border-2 border-dashed border-[rgb(var(--border))] rounded-lg p-4 text-center cursor-pointer hover:border-[rgb(var(--primary))] transition-colors"
                style={{ opacity: loading ? 0.6 : 1 }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgb(var(--text-muted))' }}>
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgb(var(--border))', borderTopColor: 'rgb(var(--primary))', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        <span style={{ fontSize: '0.875rem' }}>Uploading...</span>
                    </div>
                ) : (
                    <div style={{ color: 'rgb(var(--text-muted))', fontSize: '0.875rem' }}>
                        <FiUploadCloud size={22} style={{ margin: '0 auto 0.35rem', display: 'block', color: 'rgb(var(--primary))' }} />
                        <span>Click to upload an image</span>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>PNG, JPG, WebP · max 5 MB</div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <p style={{ color: 'rgb(var(--danger))', fontSize: '0.8rem', marginTop: '0.4rem' }}>{error}</p>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default ImageUpload;
