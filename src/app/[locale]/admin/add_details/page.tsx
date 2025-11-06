"use client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function AddDetailsPage() {
  const router = useRouter();

  const buttons = [
    { title: "Add City", desc: "Manage city details and heads", path: "/admin/city", formName : "city_form" },
    { title: "Add Centers", desc: "Setup and manage centers", path: "/admin/center", formName : "center_form" },
    { title: "Add Variants", desc: "Define test variants", path: "/admin/variant", formName : "variant_form" },
    { title: "Add Category", desc: "Organize tests by category", path: "/admin/course_category", formName : "course_category_form" },
    { title: "Location Mappings", desc: "Map City, Center, Variant & Category", path: "/admin/location_mappings", formName : "location_mappings_form" },
    { title: "Add Course", desc: "Create and manage courses", path: "/admin/course", formName : "course_form" },
    { title: "Add Batch", desc: "Create and manage batches", path: "/admin/batch", formName : "batch_form" },
    { title: "Add Course Mappings", desc: "Map courses with categories", path: "/admin/course_mappings", formName : "course_mappings_form" },
    { title: "Add Test", desc: "Configure test type options", path: "/admin/tests", formName : "tests_form" },
    { title: "Add Course Materials", desc: "Manage e-books and practice materials", path: "/admin/course_materials", formName : "course_materials_form" },
    { title: "Add Study Resources", desc: "Add study resources and content", path: "/admin/study_resources", formName : "study_resources_form" },
    { title: "Add Magazines", desc: "Publish your book here", path: "/admin/magazine", formName : "magazine_form" },
    { title: "Add Live Session", desc: "Create a Live session here", path: "/admin/live_session", formName : "live_session_form" },
    { title: "Add Nav Contents", desc: "Add Navbar Contents here", path: "/admin/nav_contents", formName : "nav_contents_form" },
  ];

  return (
    <main className={styles.container}>
      <h2 className={styles.title} style={{ textAlign: "left", marginTop: "0px" }}>
        Add Configuration
      </h2>
      <div className={styles.buttons}>
        {buttons.map((btn, i) => (
          <div
            key={i}
            className={styles.card}
            onClick={() => router.push(`${btn.path}?formName=${btn.formName}`)}
          >
            <h2 className={styles.cardTitle}>{btn.title}</h2>
            <p className={styles.cardDesc}>{btn.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
