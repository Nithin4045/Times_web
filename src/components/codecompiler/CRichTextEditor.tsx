"use client"
import dynamic from 'next/dynamic';
import { Form } from "antd";
import React, { useEffect, useMemo, useState } from 'react';
import '@/components/codecompiler/CRichTextEditor.css'

// Dynamically import JoditEditor to avoid SSR issues
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>
});

interface CRichTextEditorProps {
    value: any;
    setValue: (value: any) => void;
    onChange: (value: any) => void;
    label?: string;
    maxLength: any;
    isRequired?: boolean;
    form?: any,
    api?: string,
    errorMsg?: string,
}

const CRichTextEditor: React.FC<CRichTextEditorProps> = (props) => {
    const { value, setValue, onChange, label, maxLength, isRequired, form, api, errorMsg } = props;
    const MAX_EDITOR_LENGTH = parseInt(maxLength, 10);
    const [editorValue, setEditorValue] = useState(value);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (form) {
            let form_values = Object.assign({}, form.getFieldsValue(true), { [`${api}`]: editorValue });
            console.log(form_values, "form_values")
            form.setFieldsValue(form_values);
        }
    }, [editorValue, form, api])

    const config = useMemo(
        () => ({
            cleanHTML: {
                fillEmptyParagraph: false
            },
            iframe: true,
            showPlaceholder: false,
            removeEmptyNodes: true,
            disableNativeSpellChecker: true,
            height: 400,
            toolbar: true,
            buttons: [
                'bold', 'italic', 'underline', 'strikethrough', 'link', 'image', 'ul', 'ol', 'table',
                'source',
            ],
            hidePoweredByJodit: true,
            limitChars: maxLength,
            toolbarSticky: false,
            createAttributes: {
                table: { style: 'border:1px solid; border-spacing: 0; ' },
                tr: { style: 'border: 1px solid ' },
                td: { style: 'border: 1px solid ' }
            }
        }),
        [MAX_EDITOR_LENGTH],
    );

    const handleChange = (html: any) => {
        setValue(html);
    };

    const modifyHtml = (e: any) => {
        let modifiedContent = e.replace(/background(?=(?!-color))/g, 'background-color');
        let modifiedContent2 = modifiedContent.replace(/(<table[^>]*?)border="0"([^>]*?>)/g, '$1border="1"$2')

        setEditorValue(modifiedContent2);
        setValue(modifiedContent2);
        console.log(modifiedContent2, 'mode')
    }

    // Don't render the editor on the server
    if (!isClient) {
        return (
            <Form.Item
                name={`${api}`}
                rules={[
                    {
                        required: isRequired,
                        message: errorMsg,
                    },
                    {
                        validator: (_, value) => {
                            if ((isRequired) && (value === '<p><br></p>' || value === '')) {
                                return Promise.reject(new Error('Description Value cannot be an empty string.'));
                            }
                            return Promise.resolve();
                        },
                    },
                ]}
            >
                <div style={{ marginTop: '12px' }} id='myjoditEditor'>
                    {label && (
                        <label style={{ display: 'flex', marginBottom: '11px' }}>
                            {label}
                            {isRequired && <span style={{ color: 'red' }}>*</span>}
                        </label>
                    )}
                    <div>Loading editor...</div>
                </div>
            </Form.Item>
        );
    }

    return (
        <Form.Item
            name={`${api}`}
            rules={[
                {
                    required: isRequired,
                    message: errorMsg,
                },
                {
                    validator: (_, value) => {
                        if ((isRequired) && (value === '<p><br></p>' || value === '')) {
                            return Promise.reject(new Error('Description Value cannot be an empty string.'));
                        }
                        return Promise.resolve();
                    },
                },
            ]}
        >
            <div style={{ marginTop: '12px' }} id='myjoditEditor'>
                {label && (
                    <label style={{ display: 'flex', marginBottom: '11px' }}>
                        {label}
                        {isRequired && <span style={{ color: 'red' }}>*</span>}
                    </label>
                )}
                <JoditEditor
                    value={value}
                    config={config}
                    onBlur={(e) => modifyHtml(e)}
                    onChange={onChange}
                />
            </div>
        </Form.Item>
    );
};

export default CRichTextEditor;


