"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    RocketLaunchIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckIcon,
    SparklesIcon,
    DocumentTextIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { useStore } from "@/lib/store";

const stages = [
    { id: "idea", label: "Idea Stage", description: "Concept only, no product yet" },
    { id: "mvp", label: "MVP", description: "Working prototype or early product" },
    { id: "growth", label: "Growth", description: "Product-market fit, scaling revenue" },
    { id: "scale", label: "Scale", description: "Established business, expanding" },
];

const industries = [
    "AI / Machine Learning",
    "Blockchain / Web3",
    "FinTech",
    "HealthTech",
    "EdTech",
    "SaaS",
    "E-Commerce",
    "Climate Tech",
    "Gaming",
    "Hardware",
    "Other",
];

const steps = [
    { id: 1, title: "Basics", icon: BuildingOfficeIcon },
    { id: 2, title: "Details", icon: DocumentTextIcon },
    { id: 3, title: "Team", icon: UserGroupIcon },
    { id: 4, title: "Funding", icon: CurrencyDollarIcon },
];

export default function PitchPage() {
    const router = useRouter();
    const addStartup = useStore((state) => state.addStartup);
    const analyzeStartup = useStore((state) => state.analyzeStartup);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        tagline: "",
        description: "",
        stage: "mvp" as const,
        industry: "",
        fundingAsk: 1000000,
        teamSize: 3,
        founderName: "",
        founderEmail: "",
        website: "",
        deckUrl: "",
    });

    const updateForm = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.name && formData.tagline && formData.industry;
            case 2:
                return formData.description.length >= 50;
            case 3:
                return formData.founderName && formData.founderEmail && formData.teamSize > 0;
            case 4:
                return formData.fundingAsk > 0;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Add startup to store
            const startupId = await addStartup(formData);

            // Start analysis (runs in background)
            analyzeStartup(startupId);

            // Navigate to analysis page
            router.push(`/pitch/${startupId}`);
        } catch (error) {
            console.error("Error submitting pitch:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <motion.div
                className="absolute top-40 right-1/4 w-96 h-96 rounded-full opacity-15"
                style={{ background: "radial-gradient(circle, #00f0ff 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 8, repeat: Infinity }}
            />

            <div className="relative z-10 container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold">Apply to VentureClaw</h1>
                    <p className="text-[var(--text-secondary)]">
                        Free application • Instant AI analysis • Join our batch
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <motion.div
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${currentStep === step.id
                                            ? "bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-black"
                                            : currentStep > step.id
                                                ? "bg-[#10b981] text-black"
                                                : "glass text-[var(--text-secondary)]"
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {currentStep > step.id ? (
                                        <CheckIcon className="w-4 h-4" />
                                    ) : (
                                        <step.icon className="w-4 h-4" />
                                    )}
                                    <span className="font-medium hidden sm:inline">{step.title}</span>
                                </motion.div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`w-8 h-0.5 mx-2 ${currentStep > step.id
                                                ? "bg-[#10b981]"
                                                : "bg-[var(--glass-border)]"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Container */}
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        className="card glass p-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AnimatePresence mode="wait">
                            {/* Step 1: Basics */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Startup Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => updateForm("name", e.target.value)}
                                            placeholder="e.g., Acme AI"
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Tagline *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tagline}
                                            onChange={(e) => updateForm("tagline", e.target.value)}
                                            placeholder="e.g., AI-powered productivity for teams"
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Industry *
                                        </label>
                                        <select
                                            value={formData.industry}
                                            onChange={(e) => updateForm("industry", e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition appearance-none"
                                        >
                                            <option value="" className="bg-[var(--background)]">Select industry</option>
                                            {industries.map((ind) => (
                                                <option key={ind} value={ind} className="bg-[var(--background)]">
                                                    {ind}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Stage *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {stages.map((stage) => (
                                                <motion.button
                                                    key={stage.id}
                                                    type="button"
                                                    onClick={() => updateForm("stage", stage.id)}
                                                    className={`p-4 rounded-xl border text-left transition ${formData.stage === stage.id
                                                            ? "border-[#00f0ff] bg-[#00f0ff]/10"
                                                            : "border-[var(--glass-border)] hover:border-white/20"
                                                        }`}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className="font-medium">{stage.label}</div>
                                                    <div className="text-xs text-[var(--text-muted)]">
                                                        {stage.description}
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Details */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Description * <span className="text-[var(--text-muted)]">(min 50 characters)</span>
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => updateForm("description", e.target.value)}
                                            placeholder="Describe your startup, the problem you solve, and your solution..."
                                            rows={5}
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition resize-none"
                                        />
                                        <div className="text-right text-xs text-[var(--text-muted)] mt-1">
                                            {formData.description.length} / 50 min
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Website (optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => updateForm("website", e.target.value)}
                                            placeholder="https://yoursite.com"
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Pitch Deck URL (optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.deckUrl}
                                            onChange={(e) => updateForm("deckUrl", e.target.value)}
                                            placeholder="Link to your pitch deck (Google Slides, Notion, etc.)"
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Team */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Founder Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.founderName}
                                            onChange={(e) => updateForm("founderName", e.target.value)}
                                            placeholder="Your full name"
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Founder Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.founderEmail}
                                            onChange={(e) => updateForm("founderEmail", e.target.value)}
                                            placeholder="founder@startup.com"
                                            className="w-full px-4 py-3 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Team Size *
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="1"
                                                max="50"
                                                value={formData.teamSize}
                                                onChange={(e) => updateForm("teamSize", parseInt(e.target.value))}
                                                className="flex-1 accent-[#00f0ff]"
                                            />
                                            <div className="w-16 text-center font-bold text-lg gradient-text">
                                                {formData.teamSize}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] mt-1">
                                            Including founders and full-time employees
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Funding */}
                            {currentStep === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Funding Ask *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                value={formData.fundingAsk}
                                                onChange={(e) => updateForm("fundingAsk", parseInt(e.target.value) || 0)}
                                                placeholder="1000000"
                                                className="w-full px-4 py-3 pl-8 rounded-xl glass bg-white/5 border border-[var(--glass-border)] focus:border-[#00f0ff] focus:outline-none transition"
                                            />
                                        </div>
                                        <div className="text-sm text-[var(--text-secondary)] mt-2">
                                            = ${(formData.fundingAsk / 1000000).toFixed(2)}M
                                        </div>
                                    </div>

                                    {/* Summary Preview */}
                                    <div className="p-4 rounded-xl bg-[var(--background-tertiary)] border border-[var(--glass-border)]">
                                        <h3 className="font-medium mb-3 flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4 text-[#00f0ff]" />
                                            Pitch Summary
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-secondary)]">Startup:</span>
                                                <span className="font-medium">{formData.name || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-secondary)]">Industry:</span>
                                                <span>{formData.industry || "—"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-secondary)]">Stage:</span>
                                                <span className="capitalize">{formData.stage}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-secondary)]">Team:</span>
                                                <span>{formData.teamSize} people</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-secondary)]">Asking:</span>
                                                <span className="gradient-text font-bold">
                                                    ${(formData.fundingAsk / 1000000).toFixed(2)}M
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-[var(--glass-border)]">
                            <motion.button
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition ${currentStep === 1
                                        ? "opacity-30 cursor-not-allowed"
                                        : "glass hover:bg-white/5"
                                    }`}
                                whileHover={currentStep > 1 ? { scale: 1.02 } : {}}
                                whileTap={currentStep > 1 ? { scale: 0.98 } : {}}
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Back
                            </motion.button>

                            {currentStep < 4 ? (
                                <motion.button
                                    onClick={handleNext}
                                    disabled={!isStepValid()}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition ${isStepValid()
                                            ? "btn-primary"
                                            : "bg-[var(--glass-border)] cursor-not-allowed opacity-50"
                                        }`}
                                    whileHover={isStepValid() ? { scale: 1.02 } : {}}
                                    whileTap={isStepValid() ? { scale: 0.98 } : {}}
                                >
                                    Next
                                    <ArrowRightIcon className="w-4 h-4" />
                                </motion.button>
                            ) : (
                                <motion.button
                                    onClick={handleSubmit}
                                    disabled={!isStepValid() || isSubmitting}
                                    className={`flex items-center gap-2 px-8 py-3 rounded-xl transition ${isStepValid() && !isSubmitting
                                            ? "btn-primary"
                                            : "bg-[var(--glass-border)] cursor-not-allowed opacity-50"
                                        }`}
                                    whileHover={isStepValid() && !isSubmitting ? { scale: 1.02 } : {}}
                                    whileTap={isStepValid() && !isSubmitting ? { scale: 0.98 } : {}}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <motion.div
                                                className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <RocketLaunchIcon className="w-4 h-4" />
                                            Submit Pitch
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
