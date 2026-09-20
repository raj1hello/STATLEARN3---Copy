"use client";

import React, { useEffect, useState } from "react";
import { profileApi } from "@/lib/api/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrganizationJoinSection } from "@/components/profile/OrganizationJoinSection";
import {
  User,
  Mail,
  Building,
  Briefcase,
  GraduationCap,
  Target,
  Save,
  CheckCircle2,
  Shield,
  Eye,
  Layers,
  Award,
  FolderGit2,
  Plus,
  Trash2,
} from "lucide-react";

export default function ProfilePage() {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    department: "",
    experience: 0,
    education: "",
    stream: "statistics",
    existingSkills: [] as string[],
    careerGoal: "",
    shareProfileWithOrganizations: false,
    certifications: [] as string[],
    projects: [] as Array<{ title: string; description: string; skills?: string[] }>,
  });

  const [skillInput, setSkillInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [newProject, setNewProject] = useState({ title: "", description: "" });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await profileApi.get();
        if (res.success && res.data) {
          const data = res.data as any;
          setFormData({
            name: data.name || "",
            designation: data.designation || "",
            department: data.department || "",
            experience: data.experience || 0,
            education: data.education || "",
            stream: data.stream || "statistics",
            existingSkills: Array.isArray(data.existingSkills) ? data.existingSkills : [],
            careerGoal: data.careerGoal || "",
            shareProfileWithOrganizations: Boolean(data.shareProfileWithOrganizations),
            certifications: Array.isArray(data.certifications) ? data.certifications : [],
            projects: Array.isArray(data.projects) ? data.projects : [],
          });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await profileApi.update(formData);
      if (res.success) {
        setSavedSuccess(true);
        await refreshSession();
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.existingSkills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        existingSkills: [...formData.existingSkills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      existingSkills: formData.existingSkills.filter((s) => s !== skill),
    });
  };

  const addCertification = () => {
    if (certInput.trim() && !formData.certifications.includes(certInput.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, certInput.trim()],
      });
      setCertInput("");
    }
  };

  const removeCertification = (cert: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((c) => c !== cert),
    });
  };

  const addProject = () => {
    if (newProject.title.trim()) {
      setFormData({
        ...formData,
        projects: [...formData.projects, { ...newProject }],
      });
      setNewProject({ title: "", description: "" });
    }
  };

  const removeProject = (idx: number) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== idx),
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Profile & Privacy Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your credentials, stream specialization, and industry collaboration visibility
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* PRIVACY & INDUSTRY DISCOVERY CONSENT (Requirement 3) */}
        <Card className="p-6 border-purple-200 dark:border-purple-900/60 bg-gradient-to-r from-purple-50/50 dark:from-purple-950/30 to-indigo-50/40 dark:to-indigo-950/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Industry Collaboration & Verified Talent Discovery
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Allow verified organizations, research institutions, and partner colleges to discover your skill profile, test performance, and project credentials.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Badge variant={formData.shareProfileWithOrganizations ? "emerald" : "slate"} size="sm">
                    {formData.shareProfileWithOrganizations ? "Profile Discoverable" : "Private (Hidden from Orgs)"}
                  </Badge>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your contact information remains strictly confidential.
                  </span>
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={formData.shareProfileWithOrganizations}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shareProfileWithOrganizations: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </Card>

        {/* Core Profile Card */}
        <Card className="p-8 space-y-6 border-slate-200 dark:border-slate-800/80">
          {/* User Account Info Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-black text-2xl flex items-center justify-center border border-purple-200 dark:border-purple-800/60">
              {formData.name ? formData.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formData.name || "Statistical Officer"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <Badge variant="purple" size="sm" className="mt-1 capitalize">
                Role: {user?.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              required
              leftIcon={<User className="w-4 h-4" />}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Academic / Career Stream
              </label>
              <select
                value={formData.stream}
                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
              >
                <option value="statistics">Statistics & Probability</option>
                <option value="data-analytics">Data Analytics & BI</option>
                <option value="computer-science">Computer Science & Systems</option>
                <option value="programming">Programming (Python/R/SQL)</option>
                <option value="machine-learning">Machine Learning & AI</option>
                <option value="economics-surveys">Economics & Official Surveys</option>
              </select>
            </div>

            <Input
              label="Official Designation / Status"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. Statistical Officer Trainee"
              leftIcon={<Briefcase className="w-4 h-4" />}
            />

            <Input
              label="Department / Ministry / College"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. National Survey Division"
              leftIcon={<Building className="w-4 h-4" />}
            />

            <Input
              label="Experience (Years)"
              type="number"
              min="0"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
              placeholder="e.g. 2"
              leftIcon={<Briefcase className="w-4 h-4" />}
            />

            <Input
              label="Education & Qualifications"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="e.g. B.Sc. in Statistics & Data Analytics"
              leftIcon={<GraduationCap className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Target Career Goal / Focus Area"
            value={formData.careerGoal}
            onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
            placeholder="e.g. Senior Quantitative Research Officer & Survey Specialist"
            leftIcon={<Target className="w-4 h-4" />}
          />

          {/* Verified Skills Tag Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Verified Skill Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.existingSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-semibold"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-red-600 dark:hover:text-red-400 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
              {formData.existingSkills.length === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                  No skills added yet. Add your statistical and technical skills below.
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new skill (e.g. Sampling Theory, Python)..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSkill}
                className="text-xs font-semibold rounded-xl"
              >
                Add Tag
              </Button>
            </div>
          </div>

          {/* Certifications Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Certifications & Credentials</span>
            </label>
            <div className="space-y-2 mb-3">
              {formData.certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 text-xs font-medium"
                >
                  <span>{cert}</span>
                  <button
                    type="button"
                    onClick={() => removeCertification(cert)}
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. iGOT Certified Statistical Analyst Level 1"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                className="flex-1 bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCertification}
                className="text-xs font-semibold rounded-xl"
              >
                Add Cert
              </Button>
            </div>
          </div>

          {/* Project Showcase Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Relevant Projects & Research Work</span>
            </label>
            <div className="space-y-3 mb-3">
              {formData.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 text-xs space-y-1 relative group"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100">{proj.title}</h5>
                    <button
                      type="button"
                      onClick={() => removeProject(idx)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{proj.description}</p>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-[#121422] border border-slate-200 dark:border-slate-800 space-y-2">
              <input
                type="text"
                placeholder="Project Title (e.g. Household Survey Variance Estimator)"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
              />
              <textarea
                rows={2}
                placeholder="Brief description of analytical methodology and outcomes..."
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProject}
                  className="text-xs rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
            <Button
              type="submit"
              loading={saving}
              className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold px-6 py-2.5 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile & Privacy Preferences</span>
            </Button>
          </div>
        </Card>
      </form>

      {/* Organization Join Section for Learners and Trainers */}
      {(user?.role === "learner" || user?.role === "trainer") && (
        <OrganizationJoinSection />
      )}
    </div>
  );
}
