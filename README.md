# LifeOS - Productivity & Analytics Platform

**A personal productivity and life analytics platform designed to turn daily activity data into measurable, actionable insights.**

LifeOS was developed as an end-to-end **Business Analysis and Data Analytics portfolio project**, covering the journey from identifying a problem and defining requirements through data modelling, application development, KPI design, analytics and deployment.

### Live Application

**Live Demo:** https://get-lifeos.vercel.app/
 
---

## Project Overview

The project started with a simple business-style question:

> **Am I actually spending my time the way I planned?**

Traditional task trackers can show whether something was completed, but they do not always explain:

- How closely actual behaviour followed the original plan
- Where planned time was lost
- How much time was invested in productive growth
- Which activities caused the most lost time
- How behaviour changed over time

LifeOS was designed to capture this information and convert everyday activity data into useful performance indicators.

---

## LifeOS Process

The application follows a simple operating cycle:

**Plan → Execute → Track → Capture → Reflect → Analyse**

### Plan
Create routines and structure planned activities.

### Execute
Follow daily activities and record what actually happens.

### Track
Record completed and lost activities and compare execution against the original plan.

### Capture
Quickly record ideas, tasks and reminders without interrupting the current workflow.

### Reflect
Review daily activity and behaviour.

### Analyse
Transform activity data into KPIs, trends and actionable insights.

---

## Business Problem

Completing many tasks does not necessarily mean that time is being used according to plan.

For example, someone may achieve a high completion rate while still:

- completing activities at different times than planned,
- losing important planned activities,
- spending insufficient time on long-term development,
- or repeatedly losing time to the same activities.

Therefore, the project required more than a simple task completion percentage.

The solution needed to distinguish between:

**Completion, plan adherence, productive investment and lost time.**

---

## Project Objectives

The main objectives were to:

- Create a structured system for planning daily routines
- Compare planned activities with actual execution
- Identify productive and lost time
- Measure adherence to the original plan
- Capture unplanned ideas and tasks
- Analyse behaviour over 7-day and 30-day periods
- Identify the main drivers of lost time
- Create KPIs that support meaningful interpretation rather than simply displaying raw activity data

---

## Key Features

### Daily Activity Tracking

Users can manage daily activities and record whether activities were:

- Completed
- Lost
- Completed as planned
- Completed differently from the original plan

Planned and actual time can then be compared during analysis.

### Quick Capture & Inbox

Quick Capture provides a simple way to record an idea or task immediately.

Captured items can be:

- Stored in an active Inbox
- Given reminders
- Marked as completed
- Reviewed through completion history
- Permanently deleted when no longer required

Completed captures retain their completion date and time.

### Productivity Categories

Activity time is classified into five main categories:

| Category | Purpose |
|---|---|
| Build | Long-term growth and development |
| Maintain | Necessary everyday responsibilities |
| Enjoy | Leisure and personal enjoyment |
| Sleep | Rest and recovery |
| Lost | Planned time that was not successfully used |

Build activities can be further analysed across:

- Career
- Business
- Projects
- Learning

---

# Analytics & KPI Design

A major part of the project involved defining KPIs carefully so that each metric answered a specific question.

## Daily Score

**Business Question:**  
How much of the resolved planned routine was successfully completed?

**Calculation:**

`Completed Routine Activities ÷ Resolved Routine Activities × 100`

Where resolved routine activities include completed and lost planned routine activities.

---

## Plan Adherence

**Business Question:**  
Of the activities I completed, how many were completed according to the original plan?

**Calculation:**

`Completed As Planned ÷ Completed Routine Activities × 100`

This is intentionally different from Daily Score.

A person can therefore have a **high Daily Score but relatively low Plan Adherence**.

---

## Build Hours

**Business Question:**  
How much time was invested in activities contributing to long-term development?

Build activities include areas such as:

- Career
- Business
- Projects
- Learning

---

## Build %

**Business Question:**  
What percentage of completed activity time was invested in Build activities?

**Calculation:**

`Build Minutes ÷ Total Completed Minutes × 100`

---

## Lost Time %

**Business Question:**  
What percentage of resolved planned routine time was lost?

**Calculation:**

`Planned Lost Routine Minutes ÷ Resolved Planned Routine Minutes × 100`

Only planned routine activities marked as lost contribute to this KPI.

This prevents manually recorded or unplanned activity from incorrectly inflating the lost-time metric.

---

## Build-to-Lost Ratio

**Business Question:**  
How much productive Build time was generated for every hour of planned time lost?

**Calculation:**

`Build Time ÷ Lost Planned Time`

A higher ratio indicates that significantly more time is being invested in growth than being lost.

---

## Lost Time Drivers

Lost routine activities are grouped by activity name and ranked according to planned duration.

This identifies the activities responsible for the greatest amount of lost planned time and provides a starting point for process or behavioural improvement.

---

# Analytics Views

LifeOS supports both:

### 7-Day Analysis

Useful for short-term behavioural monitoring and identifying immediate changes.

### 30-Day Analysis

Useful for identifying broader patterns and understanding whether short-term performance is representative of longer-term behaviour.

The analytics layer includes:

- Daily Score
- Plan Adherence
- Build Hours
- Build %
- Lost Time %
- Time Allocation
- Build Focus
- Lost Time Drivers
- Build-to-Lost Ratio
- Performance Trend

---

# Example Analytical Insight

During testing with real activity data, an interesting pattern appeared:

**Daily Score: 88.3%**  
**Plan Adherence: 37.3%**

This means that a high proportion of resolved planned activities were eventually completed, but considerably fewer were completed exactly according to the original plan.

The important insight is therefore not:

> “Productivity is 88.3%.”

Instead, the analysis suggests:

> **Execution is strong, but planning accuracy and schedule adherence have room for improvement.**

This demonstrates why KPI definitions and business interpretation are as important as the dashboard itself.

Another 30-day result showed approximately:

**49.7 hours of Build activity**

with a **Build % of 21.5%**, allowing productive growth time to be evaluated separately from general completed activity.

---

# Data Quality Considerations

During development, historical Build records were identified where the more detailed Build Focus classification had not previously been captured.

Instead of artificially assigning these historical records to Career, Business, Projects or Learning, they are displayed as:

**Unassigned**

This preserves the integrity of historical data while clearly highlighting a data-quality limitation.

It also demonstrates an important analytics principle:

> Missing historical information should be exposed and understood rather than silently manufactured.

---

# Power BI Analysis

Power BI was used as part of the analytics work to explore and validate the LifeOS data and KPI logic.

The analytical work focused on:

- Data transformation
- KPI development
- Time allocation
- Productivity analysis
- Plan adherence
- Build activity
- Lost-time analysis
- Performance trends
- Data storytelling

The KPI logic developed through this analysis was also reflected in the application's web-based Insights experience.

---

# Data Model

LifeOS uses a structured PostgreSQL database through Supabase.

Core data areas include:

### Daily Activities

Stores information including:

- Activity date
- Routine reference
- Category
- Activity title
- Planned start/end time
- Actual start/end time
- Activity status
- As-planned indicator
- Build focus
- Reminder settings

### Categories

Provides the main analytical classification:

**Build | Maintain | Enjoy | Sleep | Lost**

### Ideas / Quick Capture

Stores:

- Capture title
- Description
- Type
- Status
- Priority
- Next action
- Created timestamp
- Completed timestamp

This structure allows operational activity data to feed directly into the analytics layer.

---

# Technology Stack

| Area | Technology |
|---|---|
| Front End | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| Backend / Authentication | Supabase |
| Business Intelligence | Power BI |
| Data Analysis | SQL / KPI modelling |
| Deployment | Vercel |
| Version Control | Git / GitHub |

---

# Business Analysis Skills Demonstrated

The project demonstrates practical application of:

- Problem definition
- Business requirements analysis
- Functional requirements
- Process design
- Stakeholder-focused thinking
- KPI definition
- Business rules
- Data requirements
- Data-quality identification
- User workflow design
- Testing and validation
- Translating business questions into measurable metrics

---

# Data Analysis Skills Demonstrated

The project also demonstrates:

- Data modelling
- SQL
- PostgreSQL
- Data transformation
- KPI development
- Time-based analysis
- Aggregation
- Data validation
- Trend analysis
- Power BI
- Dashboard design
- Data storytelling
- Translating data into actionable insights

---

# Screenshots

Project screenshots will demonstrate the complete LifeOS workflow.

### Daily Planning & Tracking

![LifeOS Daily Planning and Tracking](public/screenshots/Today.png)

### Quick Capture & Inbox

![LifeOS Quick Capture and Inbox](public/Quick%20Capture.png)

### 7-Day Insights

![LifeOS 30-Day Insights](public/Insights.png)

### 30-Day Insights

![LifeOS 30-Day Insights](public/Insights%2030Days.png)

### Power BI Dashboard

#### Executive Overview

![LifeOS Power BI Executive Overview](public/Executive%20Overview.png)

#### Time & Productivity Analysis

![LifeOS Power BI Time and Productivity](public/Time%20%26%20Productivity.png)

#### Build & Lost Analysis

![LifeOS Power BI Build and Lost Analysis](public/Build%20%26%20Lost%20Analysis.png)

#### Goals & Projects

![LifeOS Power BI Goals and Projects](public/Goals%20%26%20Projects.png)

---

# Project Lifecycle

This project was developed through an end-to-end lifecycle:

**Problem Identification**  
↓  
**Requirements Analysis**  
↓  
**Process Design**  
↓  
**Data Structure & Business Rules**  
↓  
**Application Development**  
↓  
**Data Collection**  
↓  
**KPI Definition**  
↓  
**Power BI / Analytics Development**  
↓  
**Testing & Validation**  
↓  
**Deployment**  
↓  
**Insight & Continuous Improvement**

---

## Future Improvements

LifeOS V1 focuses on structured planning, activity tracking and descriptive analytics. Future versions could extend the platform with:

- **AI Productivity Coach** – analyse historical activity patterns and provide personalised recommendations.
- **AI Weekly Review** – automatically summarise performance, lost-time drivers, Build activity and changes in plan adherence.
- **Predictive Analytics** – identify activities that are at higher risk of being missed based on historical behaviour.
- **Smart Scheduling** – recommend better activity times based on previous completion and adherence patterns.
- **Goal Recommendations** – connect daily behaviour with longer-term goals and highlight when progress is falling behind.
- **Anomaly Detection** – identify unusual changes in sleep, productivity, Build time or lost time.
- **Natural-Language Analytics** – allow questions such as “Why was my productivity lower this week?” or “What caused most of my lost time this month?”
- **Automated Power BI Refresh** – maintain an automatically refreshed reporting layer for longer-term analysis.
- **Enhanced Notifications** – smarter reminders based on priority, schedule and previous behaviour.
- **Extended Trend Analysis** – monthly, quarterly and year-over-year productivity analysis as more historical data becomes available.

---

## Live Demo

**LifeOS:** https://get-lifeos.vercel.app/

---

## Author

**Aravindh Ravi**

Business Analyst | Data Analyst | Product Analyst

Skills demonstrated through this project include:

**Business Analysis | Data Analytics | Power BI | SQL | PostgreSQL | Supabase | KPI Design | Data Modelling | Next.js | TypeScript | Data Storytelling**

---

*LifeOS is a portfolio project created to demonstrate the practical application of Business Analysis and Data Analytics skills through an end-to-end working solution.*
