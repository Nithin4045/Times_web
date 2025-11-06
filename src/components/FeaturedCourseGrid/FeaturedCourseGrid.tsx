'use client';

import React from 'react';
import styles from './FeaturedCourseGrid.module.css';

export interface FeaturedCourse {
  id: string;
  title: string;
  subtitle: string;
  imagePath: string;
  order: number;
  backgroundColor: string;
  textColor: string;
}

interface FeaturedCourseGridProps {
  courses: FeaturedCourse[];
}

const FeaturedCourseGrid: React.FC<FeaturedCourseGridProps> = ({ courses }) => {
  // Sort courses by order
  const sortedCourses = courses.sort((a, b) => a.order - b.order);

  return (
    <div className={styles.grid}>
      {sortedCourses.map((course) => (
        <img 
          key={course.id}
          src={`${course.imagePath}.gif`} 
          alt={course.title}
          className={styles.courseImage}
          onError={(e) => {
            // Fallback to JPG if GIF doesn't exist
            const target = e.currentTarget;
            if (!target.src.includes('.jpg')) {
              target.src = `${course.imagePath}.jpg`;
            }
          }}
        />
      ))}
    </div>
  );
};

export default FeaturedCourseGrid;
