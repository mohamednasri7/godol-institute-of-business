import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderPlus, Video, CheckCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

export default function AdminCourseContent() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('15');

  const fetchCourses = () => {
    apiFetch('/api/admin/courses')
      .then((data) => {
        setCourses(data);
        if (data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data[0].id);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !selectedCourse) return;

    const sections = selectedCourse.sections || [];
    const newSection = {
      id: Date.now(),
      courseId: selectedCourse.id,
      title: newSectionTitle,
      orderIndex: sections.length + 1,
      lessons: []
    };

    const updatedSections = [...sections, newSection];
    await apiFetch(`/api/admin/courses/${selectedCourse.id}`, {
      method: 'PUT',
      body: JSON.stringify({ sections: updatedSections })
    });

    setNewSectionTitle('');
    fetchCourses();
  };

  const handleAddLesson = async (sectionId) => {
    if (!newLessonTitle.trim() || !selectedCourse) return;

    const updatedSections = selectedCourse.sections.map((sec) => {
      if (sec.id === sectionId) {
        const lessons = sec.lessons || [];
        const newLesson = {
          id: Date.now(),
          sectionId,
          title: newLessonTitle,
          durationMinutes: Number(newLessonDuration) || 15,
          isFree: false,
          videoUrl: '',
          content: 'Detailed lesson material.'
        };
        return { ...sec, lessons: [...lessons, newLesson] };
      }
      return sec;
    });

    await apiFetch(`/api/admin/courses/${selectedCourse.id}`, {
      method: 'PUT',
      body: JSON.stringify({ sections: updatedSections })
    });

    setNewLessonTitle('');
    fetchCourses();
  };

  return (
    <AdminLayout
      title="Course Content"
      subtitle="Organize sections and manage lesson materials"
    >
      <div className="space-y-6">
        {/* Select active course */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Select Course to Edit Curriculum
            </label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-primary"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleAddSection} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="New section title..."
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary flex-1 sm:w-60"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Section</span>
            </button>
          </form>
        </div>

        {/* Sections and Lessons */}
        {selectedCourse ? (
          <div className="space-y-6">
            {selectedCourse.sections?.map((section) => (
              <div
                key={section.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      §
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">{section.title}</h3>
                  </div>
                  <span className="text-xs text-gray-400">
                    {section.lessons?.length || 0} lessons
                  </span>
                </div>

                {/* Lessons list */}
                <div className="space-y-2">
                  {section.lessons?.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="w-4 h-4 text-primary" />
                        <span className="font-medium text-gray-800">
                          {idx + 1}. {lesson.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>{lesson.durationMinutes} min</span>
                        {lesson.isFree && (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add lesson row */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="New lesson title..."
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Min"
                    value={newLessonDuration}
                    onChange={(e) => setNewLessonDuration(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary w-20"
                  />
                  <button
                    onClick={() => handleAddLesson(section.id)}
                    className="px-4 py-1.5 bg-gray-800 text-white rounded-xl text-xs font-semibold hover:bg-gray-700 shrink-0"
                  >
                    + Add Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-xs">No courses available.</p>
        )}
      </div>
    </AdminLayout>
  );
}

