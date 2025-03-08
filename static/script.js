// Employee API Client with CORS handling
class EmployeeAPIClient {
  constructor(baseURL = "http://127.0.0.1:8000/api") {
    this.baseURL = baseURL;
  }

  analyzeCV(cvFile, jdText = null, jdFile = null) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // Add CV file (required)
      formData.append("file", cvFile);

      // Add job description (at least one of jdText or jdFile is required)
      if (jdText) {
        formData.append("jd_text", jdText);
      }

      if (jdFile) {
        formData.append("jd_file", jdFile);
      }

      // Use fetch with the appropriate CORS mode instead of XHR
      fetch(`${this.baseURL}/employee`, {
        method: "POST",
        body: formData,
        mode: "cors", // Enable CORS mode
        credentials: "same-origin",
      })
        .then((response) => {
          if (!response.ok) {
            return response
              .json()
              .then((errorData) => {
                throw new Error(errorData.detail || "Failed to analyze CV");
              })
              .catch((e) => {
                throw new Error(`Server error: ${response.status}`);
              });
          }
          return response.json();
        })
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }
}
// DOM content loaded event to initialize the application
document.addEventListener("DOMContentLoaded", function () {
  const apiClient = new EmployeeAPIClient();

  // DOM elements
  const cvAnalysisForm = document.getElementById("cv-analysis-form");
  const cvFileInput = document.getElementById("cv-file");
  const jdTextArea = document.getElementById("jd-text");
  const jdFileInput = document.getElementById("jd-file");
  const submitButton = document.getElementById("submit-button");
  const errorElement = document.getElementById("error-message");
  const loadingElement = document.getElementById("loading-indicator");
  const resultsContainer = document.getElementById("results-container");

  // Form submission handler
  cvAnalysisForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // Clear previous errors
    errorElement.textContent = "";
    errorElement.style.display = "none";

    // Get form values
    const cvFile = cvFileInput.files[0];
    const jdText = jdTextArea.value.trim();
    const jdFile = jdFileInput.files[0];

    // Validate inputs
    if (!cvFile) {
      errorElement.textContent = "Please upload a CV file";
      errorElement.style.display = "block";
      return;
    }

    if (!jdText && !jdFile) {
      errorElement.textContent =
        "Please provide either a job description text or upload a job description file";
      errorElement.style.display = "block";
      return;
    }

    // Show loading state
    loadingElement.style.display = "block";
    submitButton.disabled = true;
    resultsContainer.style.display = "none";

    // Call API
    apiClient
      .analyzeCV(cvFile, jdText, jdFile)
      .then(function (result) {
        displayResults(result);
      })
      .catch(function (error) {
        errorElement.textContent = error.message;
        errorElement.style.display = "block";
      })
      .finally(function () {
        loadingElement.style.display = "none";
        submitButton.disabled = false;
      });
  });

  // Function to display results
  function displayResults(result) {
    // Clear previous results
    resultsContainer.innerHTML = "";

    // Create match score element
    const matchScoreDiv = document.createElement("div");
    matchScoreDiv.className = "match-score";

    const matchTitle = document.createElement("h4");
    matchTitle.textContent = "Job Match Score";

    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-container";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progress = document.createElement("div");
    progress.className = "progress";
    progress.style.width = `${result["JD-Match"]}%`;

    const scoreText = document.createElement("span");
    scoreText.textContent = `${result["JD-Match"]}%`;

    progressBar.appendChild(progress);
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(scoreText);

    matchScoreDiv.appendChild(matchTitle);
    matchScoreDiv.appendChild(progressContainer);

    // Create profile summary element
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "profile-summary";

    const summaryTitle = document.createElement("h4");
    summaryTitle.textContent = "Profile Summary";

    const summaryText = document.createElement("p");
    summaryText.textContent = result["Profile Summary"];

    summaryDiv.appendChild(summaryTitle);
    summaryDiv.appendChild(summaryText);

    // Create missing skills element
    const skillsDiv = document.createElement("div");
    skillsDiv.className = "missing-skills";

    const skillsTitle = document.createElement("h4");
    skillsTitle.textContent = "Missing Skills";

    skillsDiv.appendChild(skillsTitle);

    if (result["Missing Skills"].length > 0) {
      const skillsList = document.createElement("ul");

      result["Missing Skills"].forEach(function (skill) {
        const skillItem = document.createElement("li");
        skillItem.textContent = skill;
        skillsList.appendChild(skillItem);
      });

      skillsDiv.appendChild(skillsList);
    } else {
      const noSkillsText = document.createElement("p");
      noSkillsText.textContent = "No missing skills identified.";
      skillsDiv.appendChild(noSkillsText);
    }

    // Add all elements to results container
    resultsContainer.appendChild(matchScoreDiv);
    resultsContainer.appendChild(summaryDiv);
    resultsContainer.appendChild(skillsDiv);

    // Show results container
    resultsContainer.style.display = "block";
  }
});
