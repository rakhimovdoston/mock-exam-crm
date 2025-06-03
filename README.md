# IELTS Mock Exam Platform 🎓📝

A full-featured IELTS Mock Exam platform that simulates the real IELTS test experience for students. The platform offers **Listening**, **Reading**, and **Writing** tests — all administered in the same structure and format as the official IELTS exam.

## ✨ Features

- 🎧 **Listening Test**: Timed sections with audio playback and answer inputs.
- 📖 **Reading Test**: Interactive reading passages with various question types (e.g., multiple choice, matching headings, table completion).
- ✍️ **Writing Test**: Task 1 and Task 2 writing prompts with text editor and word count.
- ⏱️ **Real Exam Timings**: Mirrors official IELTS timing for each section.
- 📊 **Score Simulation**: Automatic scoring system for Listening and Reading; manual review for Writing.
- 📈 **Result Dashboard**: Users can view their scores, writing feedback, and test history.
- 👤 **User Authentication**: Register and log in to save test progress and view results.

## 🛠 Tech Stack

- **Frontend**: React.js + TypeScript + Redux Toolkit
- **Backend**: Spring Boot + PostgreSQL
- **Authentication**: JWT-based Auth
- **Deployment**: Vercel (Frontend) + Railway or Render (Backend)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn or npm
- Java 17+
- PostgreSQL database

### Frontend Setup

```bash
cd client
yarn install
yarn dev
