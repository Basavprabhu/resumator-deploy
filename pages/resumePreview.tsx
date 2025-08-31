"use client";

import { useRouter } from "next/router";
import { ResumeData } from "../pages/types/resume";
import { renderTemplate } from "../pages/lib/templateRegistry";
import { useState, useEffect } from "react";
import { logInfo, logError } from "../pages/lib/logger";
import ResumeFormEditor from "../pages/components/ResumeFormEditor";
import { ResumeService } from "../pages/lib/resumeService";
import { showSuccess, showError } from "../pages/lib/notifications";
import { useAuth } from "../pages/lib/authContext";

export default function ResumePreview() {
  const router = useRouter();
  const { user } = useAuth();
  const { template, data, id } = router.query; // Added 'id' for saved resumes
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalResumeData, setOriginalResumeData] = useState<ResumeData | null>(null);

  // Initialize data and tracking
  useEffect(() => {
    if (id && typeof id === 'string') {
      setResumeId(id);
    }
    
    if (data) {
      try {
        const parsed = JSON.parse(data as string);
        setResumeData(parsed);
        setOriginalResumeData(parsed);
        logInfo('Resume data loaded', { hasId: !!id, template });
      } catch (error) {
        logError("Failed to parse resume data", error);
        showError('Invalid resume data', 'Please try generating the resume again');
      }
    }
  }, [data, id, template]);

  // Track unsaved changes
  useEffect(() => {
    if (originalResumeData && resumeData) {
      const hasChanges = JSON.stringify(originalResumeData) !== JSON.stringify(resumeData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [originalResumeData, resumeData]);

  // Early returns after hooks
  if (!data || !template) {
    logError("Missing template or data parameters", { template, hasData: !!data });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading Resume...</h1>
          <p className="text-gray-600 mt-2">Please wait while we prepare your resume for viewing.</p>
          <button 
            onClick={() => router.push('/')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Resume</h1>
          <p className="text-gray-600 mt-2">Invalid resume data. Please try generating again.</p>
          <button 
            onClick={() => router.push('/')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 100);
  };

  const handleEditSave = async (updatedData: ResumeData) => {
    setIsSaving(true);
    try {
      // Update localStorage only
      const savedState = localStorage.getItem('resumeBuilder_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        parsed.resumeData = updatedData;
        localStorage.setItem('resumeBuilder_state', JSON.stringify(parsed));
      }
      
      // Update local state
      setResumeData(updatedData);
      setEditMode(false);
      
      showSuccess('Changes saved locally', 'Click "Save Resume" to save to Firebase');
      logInfo("Resume updated locally");
    } catch (error) {
      logError("Failed to save changes locally", error);
      showError('Save failed', 'Unable to save your changes locally.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToFirebase = async () => {
    if (!resumeData || !user?.uid) return;
    
    setIsSaving(true);
    try {
      if (resumeId) {
        // Update existing resume
        await ResumeService.updateResume(user.uid, resumeId, resumeData, template as string);
        showSuccess('Resume saved', 'Your resume has been saved successfully');
      } else {
        // Save as new resume
        const newResumeId = await ResumeService.saveResume(user.uid, resumeData, template as string);
        setResumeId(newResumeId);
        showSuccess('Resume saved', 'Your resume has been saved successfully');
        
        // Update URL to include the new ID
        const queryParams = new URLSearchParams({
          template: template as string,
          data: JSON.stringify(resumeData),
          id: newResumeId
        });
        router.replace(`/resumePreview?${queryParams.toString()}`, undefined, { shallow: true });
      }
      
      // Reset unsaved changes indicator
      setOriginalResumeData(resumeData);
      
      logInfo("Resume saved successfully", { resumeId, isNew: !resumeId });
    } catch (error) {
      logError("Failed to save resume to Firebase", error);
      showError('Save failed', 'Unable to save your resume to Firebase. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    logInfo("Edit mode cancelled");
  };





  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Controls - Hidden during print */}
      <div className="bg-white border-b shadow-sm no-print">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {editMode ? 'Edit Resume' : 'Resume Preview'}
                {hasUnsavedChanges && !editMode && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Unsaved changes
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-600">
                {resumeData.name} - {template} 
                {resumeId && <span className="text-gray-400"> • Saved resume</span>}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                ← Back to Editor
              </button>

              {/* Save Resume to Firebase Button */}
              {!editMode && (
                <button
                  onClick={handleSaveToFirebase}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-md font-medium ${
                    hasUnsavedChanges 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'border border-blue-300 text-blue-600 hover:bg-blue-50'
                  } disabled:opacity-50`}
                >
                  {isSaving ? 'Saving...' : '💾 Save Resume'}
                </button>
              )}

              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 border rounded-md font-medium ${
                  editMode 
                    ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600' 
                    : 'border-orange-300 text-orange-600 hover:bg-orange-50'
                }`}
              >
                {editMode ? "📄 Cancel Edit" : "✏️ Edit Resume"}
              </button>

              <button
                onClick={() => {
                  const confirmed = window.confirm(
                    "⚠️ Generate New Resume\n\nThis will discard your current resume and clear all saved data. Are you sure you want to continue?"
                  );
                  if (confirmed) {
                    localStorage.removeItem('resumeBuilder_state');
                    router.push('/');
                  }
                }}
                className="px-4 py-2 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50"
              >
                🆕 Generate New Resume
              </button>
              
              <button
                onClick={handlePrint}
                disabled={isExporting || editMode}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {isExporting ? "Preparing..." : "🖨️ Print to PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>

            {/* Editor or Resume Content */}
      {editMode ? (
        <div className="py-8">
          <ResumeFormEditor
            initialData={resumeData!}
            onSave={handleEditSave}
            onCancel={handleCancelEdit}
            isSaving={isSaving}
          />
        </div>
      ) : (
        <div className="py-8">
          <div
            id="resume-container"
            className="bg-white mx-auto shadow-lg border border-gray-200 print:shadow-none print:border-0"
            style={{
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '100%',
              margin: '0 auto'
            }}
          >
            <div className="p-8 print:p-6">
              {resumeData && renderTemplate(template as string, resumeData)}
            </div>
          </div>
        </div>
      )}

      {/* Print Instructions - Hidden during print */}
      <div className="bg-blue-50 border-t no-print">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">💡</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium">For best print results:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Click "Print to PDF" button above</li>
                <li>In print dialog: Set margins to "Minimum"</li>
                <li>Enable "Background graphics" option</li>
                <li>Select "Save as PDF" and click Save</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
