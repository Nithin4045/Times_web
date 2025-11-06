"use client";

import React, { useState, useEffect } from "react";
import { Modal, Checkbox, Input, Button, Space, Tag, message, Spin, Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface TranslationModalProps {
  open: boolean;
  onCancel: () => void;
  onTranslate: (config: TranslationConfig) => void;
  loading?: boolean;
}

export interface TranslationConfig {
  languages: string[];
  localWords: { word: string; context: string }[];
  globalWords: { word: string; context: string }[];
}

const AVAILABLE_LANGUAGES = [
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
  { code: "hi", name: "Hindi" },
];

export default function TranslationModal({
  open,
  onCancel,
  onTranslate,
  loading = false,
}: TranslationModalProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  
  // Local words and contexts - stored separately
  const [localWordInput, setLocalWordInput] = useState("");
  const [localContextInput, setLocalContextInput] = useState("");
  const [localWords, setLocalWords] = useState<string[]>([]);
  const [localContexts, setLocalContexts] = useState<string[]>([]);
  
  // Global words and contexts - stored separately with IDs from database
  const [globalWordInput, setGlobalWordInput] = useState("");
  const [globalContextInput, setGlobalContextInput] = useState("");
  const [globalWords, setGlobalWords] = useState<Array<{ id: number; word: string; context: string }>>([]);
  
  const [loadingGlobalWords, setLoadingGlobalWords] = useState(false);

  useEffect(() => {
    if (open) {
      fetchGlobalWords();
    }
  }, [open]);

  const fetchGlobalWords = async () => {
    setLoadingGlobalWords(true);
    try {
      const response = await fetch("/api/palms/translation/words");
      if (response.ok) {
        const data = await response.json();
        if (data.words && Array.isArray(data.words)) {
          setGlobalWords(data.words); // Array of {id, word, context}
        }
      } else {
        console.error("Failed to fetch global words:", response.status);
      }
    } catch (error) {
      console.error("Error fetching global words:", error);
    } finally {
      setLoadingGlobalWords(false);
    }
  };

  // Local handlers
  const handleAddLocalWord = () => {
    const trimmedWord = localWordInput.trim();
    if (!trimmedWord) {
      message.warning("Please enter a word or phrase");
      return;
    }
    if (localWords.includes(trimmedWord)) {
      message.warning("This word already exists in local list");
      return;
    }
    setLocalWords([...localWords, trimmedWord]);
    setLocalWordInput("");
  };

  const handleAddLocalContext = () => {
    const trimmedContext = localContextInput.trim();
    if (!trimmedContext) {
      message.warning("Please enter a context or rule");
      return;
    }
    if (localContexts.includes(trimmedContext)) {
      message.warning("This context already exists in local list");
      return;
    }
    setLocalContexts([...localContexts, trimmedContext]);
    setLocalContextInput("");
  };

  const handleRemoveLocalWord = (word: string) => {
    setLocalWords(localWords.filter((w) => w !== word));
  };

  const handleRemoveLocalContext = (context: string) => {
    setLocalContexts(localContexts.filter((c) => c !== context));
  };

  // Global handlers - save to database
  const handleAddGlobalWord = async () => {
    const trimmedWord = globalWordInput.trim();
    
    if (!trimmedWord) {
      message.warning("Please enter a word or phrase");
      return;
    }
    
    if (globalWords.some((w) => w.word === trimmedWord)) {
      message.warning("This word already exists in global list");
      return;
    }

    try {
      const response = await fetch("/api/palms/translation/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: trimmedWord,
          context: null,  // Save word only, no context
          type: "word"
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setGlobalWords([...globalWords, data.word]);
        setGlobalWordInput("");
        message.success(data.restored ? "Global word restored from database" : "Global word saved to database");
      } else {
        message.error(data.error || "Failed to save word");
      }
    } catch (error) {
      console.error("Error adding global word:", error);
      message.error("Failed to save word to database");
    }
  };

  const handleAddGlobalContext = async () => {
    const trimmedContext = globalContextInput.trim();
    
    if (!trimmedContext) {
      message.warning("Please enter a context or rule");
      return;
    }
    
    if (globalWords.some((w) => w.context === trimmedContext && !w.word)) {
      message.warning("This context already exists in global list");
      return;
    }

    try {
      const response = await fetch("/api/palms/translation/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: null,  // No word, only context
          context: trimmedContext,
          type: "context"
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setGlobalWords([...globalWords, data.word]);
        setGlobalContextInput("");
        message.success(data.restored ? "Global rule restored from database" : "Global rule saved to database");
      } else {
        message.error(data.error || "Failed to save rule");
      }
    } catch (error) {
      console.error("Error adding global context:", error);
      message.error("Failed to save rule to database");
    }
  };

  const handleRemoveGlobalWord = async (id: number) => {
    try {
      const response = await fetch(`/api/palms/translation/words?id=${id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setGlobalWords(globalWords.filter((w) => w.id !== id));
        message.success("Global word deleted from database");
      } else {
        message.error(data.error || "Failed to delete word");
      }
    } catch (error) {
      console.error("Error deleting global word:", error);
      message.error("Failed to delete word from database");
    }
  };

  const handleTranslate = () => {
    if (selectedLanguages.length === 0) {
      message.warning("Please select at least one language");
      return;
    }
    
    // Combine local words and contexts into the expected format
    const localWordsList = localWords.map((word, idx) => ({
      word,
      context: localContexts[idx] || ""
    }));
    
    // Global words already have the correct format {id, word, context}
    const globalWordsList = globalWords.map((item) => ({
      word: item.word,
      context: item.context || ""
    }));
    
    onTranslate({
      languages: selectedLanguages,
      localWords: localWordsList,
      globalWords: globalWordsList,
    });
  };

  const handleReset = () => {
    setSelectedLanguages([]);
    setLocalWords([]);
    setLocalContexts([]);
    setLocalWordInput("");
    setLocalContextInput("");
    setGlobalWordInput("");
    setGlobalContextInput("");
    // Don't reset global words - they should persist (from database)
    // Refresh from database instead
    fetchGlobalWords();
  };

  return (
    <Modal
      title="Translation Settings"
      open={open}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Reset
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="translate" type="primary" onClick={handleTranslate} loading={loading}>
          Start Translation
        </Button>,
      ]}
    >
      <Spin spinning={loadingGlobalWords}>
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <div>
            <h4 style={{ marginBottom: 8 }}>Select Languages *</h4>
            <Checkbox.Group
              options={AVAILABLE_LANGUAGES.map((lang) => ({ label: lang.name, value: lang.code }))}
              value={selectedLanguages}
              onChange={(values) => setSelectedLanguages(values as string[])}
            />
          </div>
          <Divider style={{ margin: "12px 0" }} />
          <div>
            <h4 style={{ marginBottom: 8 }}>Local Preservation Rules (Session Only)</h4>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
              Custom rules for this session only (not saved to database). Add words and contexts separately.
            </p>
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {/* Word Input Section */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#333" }}>
                  Words / Phrases to Preserve
                </label>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Enter word or phrase (e.g., 'TIMES', 'equation', 'DNA')"
                    value={localWordInput}
                    onChange={(e) => setLocalWordInput(e.target.value)}
                    onPressEnter={handleAddLocalWord}
                    size="large"
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddLocalWord}
                    size="large"
                    disabled={!localWordInput.trim()}
                  >
                    Add Word
                  </Button>
                </Space.Compact>
                {/* Display Added Words */}
                <div style={{ marginTop: 6, minHeight: 32 }}>
                  {localWords.length === 0 ? (
                    <p style={{ color: "#999", fontSize: 11, fontStyle: "italic", margin: 0 }}>No words added</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {localWords.map((word, idx) => (
                        <Tag
                          key={idx}
                          closable
                          onClose={() => handleRemoveLocalWord(word)}
                          color="orange"
                          style={{ fontSize: 12, padding: "4px 8px" }}
                        >
                          {word}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Context Input Section */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#333" }}>
                  Translation Rules / Contexts
                </label>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Enter translation rule (e.g., 'exact match', 'keep as is', 'technical term')"
                    value={localContextInput}
                    onChange={(e) => setLocalContextInput(e.target.value)}
                    onPressEnter={handleAddLocalContext}
                    size="large"
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddLocalContext}
                    size="large"
                    disabled={!localContextInput.trim()}
                  >
                    Add Rule
                  </Button>
                </Space.Compact>
                {/* Display Added Contexts */}
                <div style={{ marginTop: 6, minHeight: 32 }}>
                  {localContexts.length === 0 ? (
                    <p style={{ color: "#999", fontSize: 11, fontStyle: "italic", margin: 0 }}>No rules added</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {localContexts.map((context, idx) => (
                        <Tag
                          key={idx}
                          closable
                          onClose={() => handleRemoveLocalContext(context)}
                          color="volcano"
                          style={{ fontSize: 12, padding: "4px 8px" }}
                        >
                          {context}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Space>
          </div>
          <Divider style={{ margin: "12px 0" }} />
          <div>
            <h4 style={{ marginBottom: 8 }}>Global Preservation Rules (Saved to Database)</h4>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
              Reusable rules for all future translations. Words and contexts are saved to database.
            </p>
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {/* Add New Word Input Section */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#333" }}>
                  Word / Phrase
                </label>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Enter word (e.g., 'π', 'DNA', 'HTTP')"
                    value={globalWordInput}
                    onChange={(e) => setGlobalWordInput(e.target.value)}
                    onPressEnter={handleAddGlobalWord}
                    size="large"
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddGlobalWord}
                    size="large"
                    disabled={!globalWordInput.trim()}
                  >
                    Add Word
                  </Button>
                </Space.Compact>
              </div>

              {/* Add Context Input Section */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#333" }}>
                  Context / Rule (Optional)
                </label>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Enter context (e.g., 'keep as is', 'mathematical symbol', 'technical term')"
                    value={globalContextInput}
                    onChange={(e) => setGlobalContextInput(e.target.value)}
                    onPressEnter={handleAddGlobalContext}
                    size="large"
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddGlobalContext}
                    size="large"
                    disabled={!globalContextInput.trim()}
                  >
                    Add Rule
                  </Button>
                </Space.Compact>
                <p style={{ fontSize: 11, color: "#999", margin: "4px 0 0 0", fontStyle: "italic" }}>
                  Add context alone or together with word above
                </p>
              </div>

              {/* Display Saved Global Words from Database */}
              <div style={{ marginTop: 8 }}>
                <Divider style={{ margin: "12px 0" }} />
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#333" }}>
                  Saved Global Words from Database ({globalWords.length})
                </label>
                <div style={{ maxHeight: 280, overflowY: "auto", padding: "4px 0" }}>
                  {globalWords.length === 0 ? (
                    <div style={{ 
                      padding: 16, 
                      textAlign: "center", 
                      background: "#fafafa", 
                      borderRadius: 8,
                      border: "1px dashed #d9d9d9"
                    }}>
                      <p style={{ color: "#999", fontSize: 12, margin: 0 }}>No global words saved in database yet</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {globalWords.map((item) => {
                        const hasWord = item.word && item.word.trim();
                        const hasContext = item.context && item.context.trim();
                        
                        return (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "flex-start",
                              padding: "10px 12px",
                              background: "#f6ffed",
                              border: "1px solid #b7eb8f",
                              borderRadius: 6,
                            }}
                          >
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                              {hasWord && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, color: "#8c8c8c", fontWeight: 600 }}>WORD:</span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "#389e0d" }}>{item.word}</span>
                                </div>
                              )}
                              {hasContext && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, color: "#8c8c8c", fontWeight: 600 }}>RULE:</span>
                                  <span style={{ fontSize: 12, color: "#595959" }}>{item.context}</span>
                                </div>
                              )}
                              {!hasWord && !hasContext && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>Empty entry</span>
                                </div>
                              )}
                            </div>
                            <Button
                              type="text"
                              danger
                              size="small"
                              onClick={() => handleRemoveGlobalWord(item.id)}
                              icon={<span>✕</span>}
                              style={{ marginTop: 4 }}
                              title="Delete from database"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Space>
          </div>
        </Space>
      </Spin>
    </Modal>
  );
}
