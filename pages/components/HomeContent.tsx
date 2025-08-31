// pages/components/HomeContent.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import TemplatesIndex from "./templateindex";
import { logInfo, logError } from "../../lib/logger";

import { ResumeData } from "../../types/resume";
import { preprocessResume } from "../../lib/resumePreprocess";
import ProfileDataExtractor, { SocialProfileData } from "../../lib/profileDataExtractor";
import { showSuccess, showError, showInfo } from "../../lib/notifications";


/** Minimal spinner */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-2">
      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
    </div>
  );
}

export default function HomeContent() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [rawData, setRawData] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  
  // New social profile fields
  const [profileImage, setProfileImage] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [extractingGithubData, setExtractingGithubData] = useState(false);
  const [socialProfileData, setSocialProfileData] = useState<SocialProfileData>({});

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('resumeBuilder_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSelectedTemplate(parsed.selectedTemplate || null);
        setRawData(parsed.rawData || "");
        setTargetRole(parsed.targetRole || "");
        setResumeData(parsed.resumeData || null);
        setProfileImage(parsed.profileImage || "");
        setGithubUrl(parsed.githubUrl || "");
        setLinkedinUrl(parsed.linkedinUrl || "");
        setSocialProfileData(parsed.socialProfileData || {});
      } catch (err) {
        logError("Failed to load saved state", err);
      }
    }
  }, []);

  // Save state to localStorage whenever key values change
  useEffect(() => {
    const stateToSave = {
      selectedTemplate,
      rawData,
      targetRole,
      resumeData,
      profileImage,
      githubUrl,
      linkedinUrl,
      socialProfileData
    };
    localStorage.setItem('resumeBuilder_state', JSON.stringify(stateToSave));
  }, [selectedTemplate, rawData, targetRole, resumeData, profileImage, githubUrl, linkedinUrl, socialProfileData]);

  const handleTemplateSelect = (id: string) => {
    try {
      logInfo("Template selected", { id });
      setSelectedTemplate(id);
      setResumeData(null); // reset any previous generated resume
      setErrorMsg(null);
    } catch (err) {
      logError("Failed to select template", err);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const validation = ProfileDataExtractor.validateImageFile(file);
      if (!validation.isValid) {
        showError('Invalid image', validation.error || 'Please select a valid image file');
        return;
      }

      const dataUrl = await ProfileDataExtractor.convertImageToDataUrl(file);
      setProfileImage(dataUrl);
      showSuccess('Image uploaded', 'Profile image has been added successfully');
      logInfo('Profile image uploaded', { fileSize: file.size, fileType: file.type });
    } catch (error) {
      logError('Failed to upload image', error);
      showError('Upload failed', 'Unable to upload the image. Please try again.');
    }
  };

  const handleGithubExtraction = async () => {
    if (!githubUrl.trim()) return;

    setExtractingGithubData(true);
    try {
      showInfo('Extracting GitHub data', 'Please wait while we fetch your profile information...');
      
      const githubData = await ProfileDataExtractor.extractGitHubData(githubUrl);
      
      if (githubData) {
        setSocialProfileData(prev => ({ ...prev, github: githubData }));
        showSuccess('GitHub data extracted', `Found ${githubData.languages.length} languages and ${githubData.topRepositories.length} top repositories`);
        logInfo('GitHub data extracted successfully', { username: githubData.name });
      } else {
        showError('GitHub extraction failed', 'Unable to extract data. Please check the URL and try again.');
      }
    } catch (error) {
      logError('GitHub extraction failed', error);
      showError('GitHub extraction failed', 'Unable to extract data. Please check the URL and try again.');
    } finally {
      setExtractingGithubData(false);
    }
  };

  const handleLinkedInProcess = () => {
    if (!linkedinUrl.trim()) return;

    const linkedinData = ProfileDataExtractor.processLinkedInUrl(linkedinUrl);
    if (linkedinData) {
      setSocialProfileData(prev => ({ ...prev, linkedin: linkedinData }));
      showSuccess('LinkedIn URL saved', 'LinkedIn profile URL has been added to your resume data');
      logInfo('LinkedIn URL processed', { url: linkedinData.profileUrl });
    } else {
      showError('Invalid LinkedIn URL', 'Please enter a valid LinkedIn profile URL');
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!selectedTemplate) {
      setErrorMsg("Please select a template.");
      return;
    }
    if (!rawData.trim()) {
      setErrorMsg("Please paste your career details in the text box.");
      return;
    }
    if (!targetRole.trim()) {
      setErrorMsg("Please add the target job role.");
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      // Enhance prompt with social profile data
      const socialPromptEnhancement = ProfileDataExtractor.generatePromptEnhancement(socialProfileData);
      const enhancedRawData = rawData + socialPromptEnhancement;

      const resp = await fetch("/api/generateResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText: enhancedRawData, 
          targetRole, 
          templateId: selectedTemplate,
          profileImage 
        }),
        signal: controller.signal,
      });

      let payload: any = null;
      try {
        payload = await resp.json();
      } catch (parseErr) {
        logError("Failed to parse JSON from /api/generateResume", parseErr);
        setErrorMsg("Unexpected response from server.");
        return;
      }

      if (!resp.ok) {
        logError("API returned non-OK", { status: resp.status, payload });
        setErrorMsg(payload?.error ?? `Server returned ${resp.status}`);
        return;
      }

      const data = payload?.data as ResumeData | undefined;
      if (!data || !data.name) {
        logError("Invalid or empty resume data from API", { payload });
        setErrorMsg("Model returned invalid resume data.");
        return;
      }

      logInfo("Received structured resume", { name: data.name });

      try {
        const processed = preprocessResume(data);
        setResumeData(processed as any); // has _layout hints
        logInfo("Resume preprocessed for layout", { name: processed.name, layout: processed._layout });
        
        // Auto-navigate to preview page
        const resumeDataString = encodeURIComponent(JSON.stringify(processed));
        const url = `/resumePreview?template=${selectedTemplate}&data=${resumeDataString}`;
        router.push(url);
      } catch (preErr) {
        logError("Preprocessing failed, falling back to raw data", preErr);
        setResumeData(data);
        
        // Auto-navigate to preview page with raw data
        const resumeDataString = encodeURIComponent(JSON.stringify(data));
        const url = `/resumePreview?template=${selectedTemplate}&data=${resumeDataString}`;
        router.push(url);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        logError("Resume generation request aborted (timeout)", err);
        setErrorMsg("Request timed out. Please try again.");
      } else {
        logError("Generation failed", err);
        setErrorMsg(err?.message ?? "Unknown error");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="text-center py-6">
        <h1 className="text-3xl font-bold text-blue-700">AI Resume Builder</h1>
        <p className="text-gray-800 mt-2">
          Choose a template, paste your raw career text, specify target role — AI will structure it into a resume.
        </p>
      </header>

      <section className="max-w-6xl mx-auto py-6">
  <h2 className="text-2xl font-semibold mb-4 text-gray-900 text-center">Choose a Template</h2>

  <div className="flex justify-center">
    <TemplatesIndex selectedTemplate={selectedTemplate} onSelect={handleTemplateSelect} />
  </div>
</section>


      <section className="max-w-3xl mx-auto py-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-900">Add Your Details</h2>

        <textarea
          className="w-full border rounded-lg p-3 mb-4 text-gray-900"
          rows={8}
          placeholder="Paste your career details (education, experience, skills, etc.)"
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
        />

        <input
          className="w-full border rounded-lg p-3 mb-4 text-gray-900"
          type="text"
          placeholder="Target Job Role (e.g. Frontend Developer)"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
        />

        {/* Profile Photo Upload */}
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📸 Profile Photo (Optional)</h3>
          <div className="flex items-center gap-4">
            {profileImage && (
              <img 
                src={profileImage} 
                alt="Profile preview" 
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
              />
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload JPEG, PNG, or WebP (max 5MB)</p>
            </div>
            {profileImage && (
              <button
                onClick={() => setProfileImage("")}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Social Profile Links */}
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🔗 Social Profile Links (Optional)</h3>
          
          {/* GitHub URL */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">GitHub Profile</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://github.com/username or just username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="flex-1 border rounded-md p-2 text-sm"
              />
              <button
                onClick={handleGithubExtraction}
                disabled={!githubUrl.trim() || extractingGithubData}
                className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extractingGithubData ? '...' : 'Extract Data'}
              </button>
            </div>
            {socialProfileData.github && (
              <div className="mt-2 text-xs text-green-600">
                ✅ Data extracted: {socialProfileData.github.languages.length} languages, {socialProfileData.github.topRepositories.length} repos
              </div>
            )}
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn Profile</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="flex-1 border rounded-md p-2 text-sm"
              />
              <button
                onClick={handleLinkedInProcess}
                disabled={!linkedinUrl.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save URL
              </button>
            </div>
            {socialProfileData.linkedin && (
              <div className="mt-2 text-xs text-blue-600">
                ✅ LinkedIn URL saved: {socialProfileData.linkedin.profileUrl}
              </div>
            )}
          </div>
        </div>

        {errorMsg && <div className="mb-4 text-red-600 font-medium">{errorMsg}</div>}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60"
          >
            {loading ? <Spinner /> : null}
            Generate Resume
          </button>

          <button
            onClick={() => {
              setRawData("");
              setTargetRole("");
              setResumeData(null);
              setProfileImage("");
              setGithubUrl("");
              setLinkedinUrl("");
              setSocialProfileData({});
              setErrorMsg(null);
              setLoading(false);
              setSelectedTemplate(null);
              localStorage.removeItem('resumeBuilder_state');
            }}
            className="px-4 py-2 border rounded-md"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Show loading state */}
      {loading && (
        <section className="max-w-4xl mx-auto py-8">
          <div className="flex items-center justify-center py-6">
            <Spinner />
            <span className="ml-3 text-gray-700">Generating resume — this may take a few seconds...</span>
          </div>
        </section>
      )}

      {/* Show resume actions when resume exists */}
      {resumeData && !loading && (
        <section className="max-w-4xl mx-auto py-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Resume Ready!</h2>
              <p className="text-gray-600 mb-6">Your resume has been generated successfully.</p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    const resumeDataString = encodeURIComponent(JSON.stringify(resumeData));
                    const url = `/resumePreview?template=${selectedTemplate}&data=${resumeDataString}`;
                    router.push(url);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  📄 View & Print Resume
                </button>
                
                <button
                  onClick={() => {
                    setResumeData(null);
                    setErrorMsg(null);
                  }}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
                >
                  ✏️ Edit Details
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
