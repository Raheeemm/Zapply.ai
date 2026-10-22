import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

const emptyResume = {
  full_name: "",
  contact: [],
  professional_summary: "",
  technical_skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  additional_sections: {},
};

function App() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [resume, setResume] = useState(emptyResume);
  const [proposalId, setProposalId] = useState(null);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [approvedId, setApprovedId] = useState(null);

  async function loadHistory() {
    try {
      const response = await fetch(`${API}/proposals`);

      if (!response.ok) {
        throw new Error("Unable to load history.");
      }

      const data = await response.json();
      setHistory(data.proposals);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function updateResume(field, value) {
    setResume((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function analyzeJob(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");
    setApprovedId(null);
    setAnalysis(null);

    try {
      const form = new FormData();

      form.append("job_title", jobTitle);
      form.append("job_description", jobDescription);

      if (!resumeFile) {
        throw new Error("Please upload your resume.");
      }

      form.append("resume_file", resumeFile);

      if (jdFile) {
        form.append("job_description_file", jdFile);
      }

      const response = await fetch(`${API}/analyze`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Analysis failed.");
      }

      setProposalId(data.id);
      setAnalysis(data.analysis);
      setResume(data.analysis.resume);

      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function decide(decision) {
    if (!proposalId) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/proposals/${proposalId}/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            revised_resume:
              decision === "reject" ? null : resume,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Action failed.");
      }

      setMessage(data.message);

      if (decision === "approve") {
        setApprovedId(proposalId);
        setProposalId(null);
      } else if (decision === "reject") {
        setProposalId(null);
        setAnalysis(null);
      } else {
        setResume(data.resume);
      }

      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadResume(id, format = "docx") {
  setError("");

  try {
    const response = await fetch(
      `${API}/proposals/${id}/download?format=${format}`
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Download failed.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `zapply_resume_${id}.${format}`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  } catch (err) {
    setError(err.message);
  }
}

  function updateList(field, value) {
    updateResume(
      field,
      value.split("\n").filter((item) => item.trim())
    );
  }

  function updateItem(field, index, key, value) {
    const updated = [...resume[field]];
    updated[index] = {
      ...updated[index],
      [key]: value,
    };

    updateResume(field, updated);
  }

  function updateItemList(field, index, key, value) {
    updateItem(
      field,
      index,
      key,
      value.split("\n").filter((item) => item.trim())
    );
  }

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          zapply<span>.ai</span>
        </div>

        <div className="tagline">
          AI suggests. You decide.
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">HUMAN-IN-THE-LOOP AI</p>

        <h1>Your resume. Tailored to your next opportunity.</h1>

        <p>
          Upload your existing resume, provide a job description,
          review the AI's suggestions, and download your approved
          resume.
        </p>
      </section>

      <section className="panel">
        <h2>Start with your documents</h2>

        <form onSubmit={analyzeJob}>
          <label>Target job title</label>

          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Junior Software Engineer"
            maxLength={200}
            required
          />

          <label>Upload your resume</label>

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) =>
              setResumeFile(e.target.files?.[0] || null)
            }
            required
          />

          {resumeFile && (
            <p className="file-info">
              Selected: {resumeFile.name}
            </p>
          )}

          <label>Job description</label>

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here, or upload it below."
            rows={6}
            maxLength={20000}
          />

          <label>Or upload a job description</label>

          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) =>
              setJdFile(e.target.files?.[0] || null)
            }
          />

          {jdFile && (
            <p className="file-info">
              Selected: {jdFile.name}
            </p>
          )}

          <p className="hint">
            PDF and DOCX resumes are supported. Scanned PDFs
            without selectable text are not supported yet.
          </p>

          <button disabled={loading}>
            {loading
              ? "Analyzing documents..."
              : "Analyze & Generate Resume"}
          </button>
        </form>
      </section>

      {error && (
        <div className="alert error">{error}</div>
      )}

      {message && (
        <div className="alert success">{message}</div>
      )}

      {analysis && proposalId && (
        <section className="panel">
          <div className="status">
            AWAITING HUMAN APPROVAL
          </div>

          <h2>Job analysis</h2>

          <AnalysisList
            title="Key requirements"
            items={analysis.key_requirements}
          />

          <AnalysisList
            title="Matching skills"
            items={analysis.matching_skills}
          />

          <AnalysisList
            title="Missing or unverified skills"
            items={analysis.missing_or_unverified_skills}
          />

          <AnalysisList
            title="Recommendations"
            items={analysis.recommendations}
          />

          <hr />

          <h2>Review your tailored resume</h2>

          <p className="hint">
            Edit the proposed content before approving it.
            Your original uploaded file remains unchanged.
          </p>

          <label>Full name</label>

          <input
            value={resume.full_name}
            onChange={(e) =>
              updateResume("full_name", e.target.value)
            }
          />

          <label>Contact details (one per line)</label>

          <textarea
            rows={3}
            value={resume.contact.join("\n")}
            onChange={(e) =>
              updateList("contact", e.target.value)
            }
          />

          <label>Professional summary</label>

          <textarea
            rows={5}
            value={resume.professional_summary}
            onChange={(e) =>
              updateResume("professional_summary", e.target.value)
            }
          />

          <label>Technical skills (one per line)</label>

          <textarea
            rows={5}
            value={resume.technical_skills.join("\n")}
            onChange={(e) =>
              updateList("technical_skills", e.target.value)
            }
          />

          <h3>Experience</h3>

          {resume.experience.map((item, index) => (
            <div className="editor-card" key={index}>
              <label>Role</label>

              <input
                value={item.role}
                onChange={(e) =>
                  updateItem("experience", index, "role", e.target.value)
                }
              />

              <label>Company</label>

              <input
                value={item.company}
                onChange={(e) =>
                  updateItem("experience", index, "company", e.target.value)
                }
              />

              <label>Dates</label>

              <input
                value={item.dates}
                onChange={(e) =>
                  updateItem("experience", index, "dates", e.target.value)
                }
              />

              <label>Achievements (one per line)</label>

              <textarea
                rows={4}
                value={item.bullets.join("\n")}
                onChange={(e) =>
                  updateItemList(
                    "experience",
                    index,
                    "bullets",
                    e.target.value
                  )
                }
              />
            </div>
          ))}

          <h3>Projects</h3>

          {resume.projects.map((item, index) => (
            <div className="editor-card" key={index}>
              <label>Project name</label>

              <input
                value={item.name}
                onChange={(e) =>
                  updateItem("projects", index, "name", e.target.value)
                }
              />

              <label>Technologies (one per line)</label>

              <textarea
                rows={2}
                value={item.technologies.join("\n")}
                onChange={(e) =>
                  updateItemList(
                    "projects",
                    index,
                    "technologies",
                    e.target.value
                  )
                }
              />

              <label>Details (one per line)</label>

              <textarea
                rows={4}
                value={item.bullets.join("\n")}
                onChange={(e) =>
                  updateItemList(
                    "projects",
                    index,
                    "bullets",
                    e.target.value
                  )
                }
              />
            </div>
          ))}

          <h3>Education</h3>

          {resume.education.map((item, index) => (
            <div className="editor-card" key={index}>
              <label>Degree</label>

              <input
                value={item.degree}
                onChange={(e) =>
                  updateItem("education", index, "degree", e.target.value)
                }
              />

              <label>Institution</label>

              <input
                value={item.institution}
                onChange={(e) =>
                  updateItem(
                    "education",
                    index,
                    "institution",
                    e.target.value
                  )
                }
              />

              <label>Dates</label>

              <input
                value={item.dates}
                onChange={(e) =>
                  updateItem("education", index, "dates", e.target.value)
                }
              />

              <label>Details (one per line)</label>

              <textarea
                rows={3}
                value={item.details.join("\n")}
                onChange={(e) =>
                  updateItemList(
                    "education",
                    index,
                    "details",
                    e.target.value
                  )
                }
              />
            </div>
          ))}

          <label>Certifications (one per line)</label>

          <textarea
            rows={3}
            value={resume.certifications.join("\n")}
            onChange={(e) =>
              updateList("certifications", e.target.value)
            }
          />

          {Object.entries(resume.additional_sections || {}).map(
            ([section, items]) => (
              <div key={section}>
                <label>{section} (one per line)</label>

                <textarea
                  rows={3}
                  value={items.join("\n")}
                  onChange={(e) =>
                    updateResume("additional_sections", {
                      ...resume.additional_sections,
                      [section]: e.target.value
                        .split("\n")
                        .filter((item) => item.trim()),
                    })
                  }
                />
              </div>
            )
          )}

          <div className="actions">
            <button
              disabled={loading}
              onClick={() => decide("approve")}
            >
              Approve Resume
            </button>

            <button
              className="secondary"
              disabled={loading}
              onClick={() => decide("modify")}
            >
              Save Changes
            </button>

            <button
              className="danger"
              disabled={loading}
              onClick={() => decide("reject")}
            >
              Reject
            </button>
          </div>
        </section>
      )}

      {approvedId && (
  <section className="panel download-panel">
    <h2>Resume approved!</h2>

    <p>
      Your tailored resume is ready. Choose your preferred
      download format.
    </p>

    <div className="actions">
      <button
        onClick={() => downloadResume(approvedId, "pdf")}
      >
        Download PDF
      </button>

      <button
        className="secondary"
        onClick={() => downloadResume(approvedId, "docx")}
      >
        Download Word (.docx)
      </button>
    </div>
  </section>
)}

      <footer>zapply.ai · AI suggests. You decide.</footer>
    </main>
  );
}

function AnalysisList({ title, items = [] }) {
  return (
    <div>
      <h3>{title}</h3>

      {items.length === 0 ? (
        <p className="hint">No items identified.</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;