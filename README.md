# ATS-Eureka: AI-Powered Resume Screening System

ATS-Eureka is an intelligent Applicant Tracking System that leverages AI to analyze resumes against job descriptions, providing detailed matching scores and insights for both employers and job seekers.

## 🚀 Features

- **AI-Powered Resume Analysis**: Advanced matching algorithm using Google's Gemini 2.5 Flash model
  - State-of-the-art language understanding
  - Fast and efficient processing
  - Accurate skill matching and analysis
  - Contextual understanding of job requirements
- **Dual Interface**: Separate portals for employers and job seekers
- **Instant Feedback**: Get detailed analysis with matching scores and skill gaps
- **Batch Processing**: Analyze multiple resumes simultaneously
- **Rate Limiting**: Managed API access with Redis-based rate limiting
- **Secure Authentication**: JWT-based authentication system

## 🚀 Recent Updates (v1.1)

- **Performance Boost**: Implemented concurrent processing (`asyncio.gather`) for the employer's batch analysis endpoint, cutting response times by over 50%.
- **Containerization**: Fully containerized the backend application using Docker for consistent, portable, and scalable deployments.
- **Cloud-Native Workflow**: Established a professional workflow for pushing versioned Docker images to a remote container registry (AWS ECR), enabling a true CI/CD pipeline.
- **Architectural Refactoring**: Centralized all environment variable management into a dedicated configuration module, improving robustness and preventing startup errors in Docker.
- **Bug Fixes & Enhancements**: Corrected the employer history endpoint to accurately display job batches and their ranked candidates.

## 💻 Tech Stack

### Backend

- **FastAPI**: Modern, high-performance Python web framework
- **MongoDB Atlas**: Cloud-native database for storing user data and analysis results
- **Redis Cloud**: In-memory data store for rate limiting and caching
- **Google Gemini AI**: Advanced language model for resume analysis
- **Docker & AWS ECR**: For containerization and cloud-native image storage
- **Deployment**: Ready for deployment on any container-based platform (e.g., AWS ECS, Fargate, Heroku)

### Frontend

- **HTML5/CSS3**: Modern, responsive design
- **JavaScript**: Dynamic client-side functionality
- **AWS S3 & CloudFront**: Static asset hosting and CDN

## 🛠️ Installation

### Prerequisites

- Python 3.10+
- MongoDB Atlas account
- Redis Cloud account
- Google Gemini API key

### Backend Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/ATS-Eureka.git
cd ATS-Eureka
```

2. Create and activate virtual environment

```bash
python -m venv venv
.\venv\Scripts\activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Set up environment variables (.env)

```plaintext
MONGO_URI=your_mongodb_uri
SECRET_KEY=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
REDIS_USERNAME=your_redis_username
```

5. Run the application

```bash
uvicorn app:app --reload
```

## 📚 API Documentation

### Authentication Endpoints

#### Register Employer

- **POST** `/api/register/employer`

```json
{
  "company_name": "string",
  "business_email": "string",
  "password": "string",
  "confirm_password": "string"
}
```

#### Register Employee

- **POST** `/api/register/employee`

```json
{
  "full_name": "string",
  "email": "string",
  "password": "string",
  "confirm_password": "string"
}
```

#### Login

- **POST** `/api/token`

```json
{
  "username": "string",
  "password": "string",
  "user_type": "string"
}
```

### Resume Analysis Endpoints

#### Employee CV Analysis

- **POST** `/api/employee`
- **Content-Type**: `multipart/form-data`
- **Authorization**: Bearer Token

```plaintext
file: CV file (PDF/DOCX)
jd_text: Job Description text (optional)
jd_file: Job Description file (optional)
```

#### Employer Batch Analysis

- **POST** `/api/employer`
- **Content-Type**: `multipart/form-data`
- **Authorization**: Bearer Token

```plaintext
jd_text: Job Description text (optional)
jd_file: Job Description file (optional)
candidates: Multiple CV files (PDF/DOCX)
```

### Profile Endpoints

#### Get User Profile

- **GET** `/api/profile`
- **Authorization**: Bearer Token

#### Get Analysis History

- **GET** `/api/profile/history`
- **Authorization**: Bearer Token

## 🚀 Deployment

The application is containerized with Docker, making it highly portable.

### Recommended Workflow (AWS ECR)

This workflow is aligned with modern DevOps practices and prepares the application for a scalable cloud deployment on services like AWS ECS or Fargate.

1.  **Build the Docker Image**
    ```bash
    docker build -t ats-eureka .
    ```
2.  **Authenticate with a Container Registry** (e.g., AWS ECR)
    ```bash
    aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-aws-account-id.dkr.ecr.your-region.amazonaws.com
    ```
3.  **Tag the Image**
    ```bash
    docker tag ats-eureka:latest your-aws-account-id.dkr.ecr.your-region.amazonaws.com/ats-eureka:latest
    ```
4.  **Push the Image to the Registry**
    ```bash
    docker push your-aws-account-id.dkr.ecr.your-region.amazonaws.com/ats-eureka:latest
    ```
    The image can now be pulled and run on any server or cloud service.

### Simple Local/Heroku Deployment

For quick testing or simple deployments, you can run the container locally or push it directly to Heroku.

1.  **Run Locally**
    ```bash
    # Make sure your .env file is configured
    docker run -p 8000:8000 --env-file .env ats-eureka
    ```
2.  **Deploy to Heroku**

    ```bash
    # Login and create app
    heroku login
    heroku create your-app-name
    heroku container:login

    # Set environment variables in Heroku dashboard

    # Push and release
    heroku container:push web -a your-app-name
    heroku container:release web -a your-app-name
    ```

### Frontend Deployment (AWS)

1. Build frontend assets
2. Upload to S3 bucket
3. Configure CloudFront distribution

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- Baibhab Adhikari
- Garima Roy
- Souharda Shikhar Biswas
- Leeza Bhowal

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
