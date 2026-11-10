# Agenda Website — Updated Requirements

> Source: `Agenda Website.pdf` (Version 1.1). This markdown mirror is for easier reading; the PDF remains the original deliverable. Extracted during Phase 1 foundation setup.

**Version:** 1.1  
**Domain:** humanrightsagenda.org  
**Languages:** Arabic and English  
**Platforms:** Public Website + Admin Dashboard

---

## 1. Public Website

The website contains four main pages and two detail-page types.

| Page | Main Function |
| --- | --- |
| Home | Featured publications, events, and Agenda overview |
| Publications | Search, filter, and explore publications |
| Publication Details | Read publication details, preview/download PDFs |
| Events | Search, filter, and explore events |
| Event Details | View complete event information |
| About Us | Founders' biographies, vision, and mission |

### 1.1 Home Page

#### Section 1 — Featured Publications Slider

- Main title
- Subtitle
- Full slider image
- Publication date
- Publication category (Reports, Blogs, Papers, Briefings)
- Founder/author name for blogs
- Manual previous/next slider navigation
- Clickable publication linking to its details page
- Clickable blog author linking to their biography on About Us

**Admin control:** Administrators manually select which publications appear in the slider.

#### Section 2 — Publications Catalogue

- Displays selected publications.
- Each card contains an image, title, category, and date.
- Clicking a publication opens its details page.
- View All Publications button.

#### Section 3 — Events Catalogue

- Displays up to three events.
- Each card contains an image, title, and event date.
- Clicking an event opens its details page.
- View All Events button.

**Admin control:** Administrators manually select the three events displayed.

#### Section 4 — About Us Overview

- Short organizational introduction
- Vision
- Mission
- Link to the complete About Us page

### 1.2 Publications Page

**Route:** `/publications`

Displays all publications in a searchable, filterable catalogue.

**Search:** Search publications by title.

**Category filter:**

- All
- Reports
- Blogs
- Papers
- Briefings

#### Publication Details Page — Field Requirements

| Field | Notes |
| --- | --- |
| Main Title | Arabic and English |
| Subtitle | Arabic and English |
| Main Image | Large banner |
| Sub-images | Image gallery |
| Publication Date | Date displayed to visitors |
| Category | Report / Blog / Paper / Briefing |
| Description | Markdown content |
| PDF | Online preview and download |
| Author | Founder selection for blog publications |

**Author navigation**

- Only founders can be assigned as blog authors.
- Every founder has a biography on the About Us page.
- Clicking a blog author's name navigates directly to that founder's biography.

### 1.3 Events Page

**Route:** `/events`

Displays all events with search and filtering.

**Search:** Search events by title.  
**Filter:** Filter by event record creation date.

#### Event Details Page — Field Requirements

| Field | Notes |
| --- | --- |
| Main Title | Arabic and English |
| Subtitle | Arabic and English |
| Main Image | Large banner |
| Sub-images | Image gallery |
| Event Date | Event date |
| Description | Markdown content |

**Important:** Event date and creation date are separate fields. Visitors see the event date, while the filter uses the record's creation date.

### 1.4 About Us Page

#### Section 1 — Founders' Biographies

Each founder has:

- Profile image
- Full name
- Biography
- Professional area / position
- Email address
- Unique biography section for direct linking

Only founders can be associated with blog publications.

#### Section 2 — Organization

- Vision
- Mission
- Additional organizational information where applicable

---

## 2. Admin Dashboard

The Admin Dashboard is responsible for managing publications, events, and their homepage visibility.

### 2.1 Administrator Authentication

- Secure administrator login
- Protected admin routes
- Logout functionality

### 2.2 Publications Management

Administrators can:

- Create / view / edit / delete publications
- Assign publication categories
- Assign a founder as the author of a blog
- Upload main images and sub-images
- Write Markdown descriptions
- Upload PDF documents
- Enter Arabic and English content
- Select publications for the Home page slider
- Manage slider ordering

#### Publication Form Fields

| Field | Type |
| --- | --- |
| Main Title (AR / EN) | Text |
| Subtitle (AR / EN) | Text |
| Main Image | Image upload |
| Sub-images | Multiple image upload |
| Date | Date picker |
| Category | Select |
| Author | Founder selection (Blogs only) |
| Description (AR / EN) | Markdown editor |
| PDF Attachment | PDF upload |
| Featured on Home | Selection control |
| Slider Position | Ordering control |

### 2.3 Events Management

Administrators can:

- Create / view / edit / delete events
- Upload main images and sub-images
- Write descriptions using Markdown
- Enter Arabic and English content
- Manually select three events for the homepage
- Manage homepage event ordering

#### Event Form Fields

| Field | Type |
| --- | --- |
| Main Title (AR / EN) | Text |
| Subtitle (AR / EN) | Text |
| Main Image | Image upload |
| Sub-images | Multiple image upload |
| Event Date | Date picker |
| Description (AR / EN) | Markdown editor |
| Featured on Home | Selection control |
| Homepage Position | Ordering control |
| Creation Date | Automatically generated |

### 2.4 Homepage Content Management

**Featured publications**

- Select publications for the slider
- Remove publications from the slider
- Reorder selected publications

**Featured events**

- Select up to three events
- Change the selected events
- Reorder the three events

The Home page automatically reflects the administrator's saved selections.

### 2.5 About Us Content

**Scope update (2026-10-18):** The Admin Dashboard **does** manage founder profiles (names, biographies, professional areas, emails, profile images, and display order). Creating a founder does **not** create an `AdminUser` login. Organization vision, mission, and other organizational copy remain outside the Admin Dashboard.

This instruction supersedes the earlier restriction in `Agenda Website.pdf` / prior wording of this section that excluded founder management from admin. The PDF is left unchanged as the original source document; this markdown requirements file records the update.

---

## 3. Language and Localization Requirements

The public website supports:

- Arabic — RTL (right-to-left)
- English — LTR (left-to-right)

**Functional requirements**

- Language switcher
- Navigation labels translated into both languages
- Arabic and English publication content
- Arabic and English event content
- Appropriate text alignment and direction
- Responsive layouts in both languages
- Markdown rendering for both languages

The Admin Dashboard must allow entering and editing localized publication and event content.

---

## 4. PDF Functionality

Publications can have attached PDF documents.

**Preview**

- Visitors can open and read the PDF in the browser.
- The PDF preview should support standard document navigation.

**Download**

- Provide a Download PDF button.
- Visitors can save a copy of the document.

The PDF attachment is managed through the publication form in the Admin Dashboard.

---

## 5. Homepage Selection Rules

| Content | Managed by |
| --- | --- |
| Featured slider publications | Manual Admin |
| Homepage events (maximum 3) | Manual Admin |
| Publications catalogue | Displays selected publications (Admin selection) |
| About Us overview | Static organizational content (Website content) |

---

## 6. Main Website Requirements Summary

| Feature | Public Website | Admin Dashboard |
| --- | --- | --- |
| Arabic and English | Yes | Localized content entry |
| Publications | View, search, filter | Create, edit, delete |
| Events | View, search, filter by creation date | Create, edit, delete |
| Markdown Content | Render | Edit |
| PDFs | Preview, download | Upload, manage |
| Images | View | Upload, manage |
| Blog Authors | Founder bio links | Select founder |
| Homepage Slider | View, navigate manually | Select, reorder |
| Homepage Events | View three selected events | Select, reorder |
| About Us founders | View | Create, edit, delete, reorder |
| About Us vision/mission | View | Not managed through admin |

---

## 7. Project Scope

### Public Website

- Home
- Publications
- Publication Details
- Events
- Event Details
- About Us
- Language switching
- Responsive design

### Admin Dashboard

- Login/logout
- Publications management
- Events management
- Homepage featured content selection

### Shared Backend

- Publication records
- Event records
- Founder-author associations
- Image and PDF storage
- Localized content
- Administrator authentication
- Homepage selection and ordering
