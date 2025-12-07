import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  X,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Languages,
  Tag,
  FileText,
  MoreVertical,
  Eye,
  EyeOff,
  Save,
  Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import {
  createPractice,
  getMyPractices,
  updatePractice,
  publishPractice,
  deletePractice,
  createPracticeCard,
  getPracticeCards,
  updatePracticeCard,
  deletePracticeCard,
} from '../../services/quizService';
import { uploadFlashcardFile } from '../../services/uploadService';

export default function TeacherQuiz() {
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPractice, setEditingPractice] = useState(null);
  const [isManagingCards, setIsManagingCards] = useState(false);
  const [managingPracticeId, setManagingPracticeId] = useState(null);
  const [practiceCards, setPracticeCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    topic: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch practices
  const fetchPractices = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.topic) params.topic = filters.topic;

      const data = await getMyPractices(params);
      setPractices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách bài tập.');
      toast.error(err.message || 'Không thể tải danh sách bài tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPractices();
  }, [filters.category, filters.topic]);

  // Filter practices by search term
  const filteredPractices = practices.filter((practice) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return (
      practice.title?.toLowerCase().includes(keyword) ||
      practice.description?.toLowerCase().includes(keyword) ||
      practice.topic?.toLowerCase().includes(keyword) ||
      practice.category?.toLowerCase().includes(keyword)
    );
  });

  // Initial values for form
  const getInitialValues = () => ({
    title: '',
    description: '',
    category: 'vocabulary',
    topic: '',
    language: 'en',
    published: false,
    cards: [
      {
        front: '',
        back: '',
        example: '',
        orderIndex: 0,
      },
    ],
  });

  // Handle create form submit
  const handleCreateSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Validate cards
      const validCards = values.cards.filter(
        (card) => card.front.trim() && card.back.trim()
      );

      if (validCards.length === 0) {
        toast.error('Vui lòng thêm ít nhất một thẻ flashcard.');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        topic: values.topic.trim(),
        language: values.language,
        published: values.published,
        cards: validCards.map((card, index) => ({
          front: card.front.trim(),
          back: card.back.trim(),
          example: card.example.trim() || '',
          orderIndex: index,
        })),
      };

      await createPractice(payload);
      toast.success('Tạo bài tập thành công!');
      setIsCreating(false);
      resetForm();
      fetchPractices();
    } catch (err) {
      toast.error(err.message || 'Tạo bài tập thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit click
  const handleEditClick = (practice) => {
    setEditingPractice(practice);
    setIsEditing(true);
    setOpenMenuId(null);
  };

  // Handle edit form submit
  const handleEditSubmit = async (values, { setSubmitting }) => {
    try {
      if (!editingPractice) return;

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        topic: values.topic.trim(),
        language: values.language,
        published: values.published,
      };

      await updatePractice(editingPractice.id, payload);
      toast.success('Cập nhật bài tập thành công!');
      setIsEditing(false);
      setEditingPractice(null);
      fetchPractices();
    } catch (err) {
      toast.error(err.message || 'Cập nhật bài tập thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (practiceId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      await deletePractice(practiceId);
      toast.success('Xóa bài tập thành công!');
      setOpenMenuId(null);
      fetchPractices();
    } catch (err) {
      toast.error(err.message || 'Xóa bài tập thất bại.');
    }
  };

  // Handle publish/unpublish
  const handlePublish = async (practice) => {
    try {
      const newPublishedStatus = !practice.published;
      await publishPractice(practice.id || practice.practiceId, newPublishedStatus);
      toast.success(newPublishedStatus ? 'Đã công khai bài tập!' : 'Đã ẩn bài tập!');
      setOpenMenuId(null);
      fetchPractices();
    } catch (err) {
      toast.error(err.message || 'Thay đổi trạng thái thất bại.');
    }
  };

  // Handle manage cards
  const handleManageCards = async (practice) => {
    try {
      setManagingPracticeId(practice.id || practice.practiceId);
      setIsManagingCards(true);
      setOpenMenuId(null);
      await fetchPracticeCards(practice.id || practice.practiceId);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách thẻ.');
    }
  };

  // Fetch practice cards
  const fetchPracticeCards = async (practiceId) => {
    setLoadingCards(true);
    try {
      const cards = await getPracticeCards(practiceId);
      setPracticeCards(Array.isArray(cards) ? cards : []);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách thẻ.');
      setPracticeCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  // Handle create card
  const handleCreateCard = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!managingPracticeId) return;

      let imageS3Key = null;
      let audioS3Key = null;

      // Upload image if provided
      if (values.imageFile) {
        setUploadingFile(true);
        try {
          const result = await uploadFlashcardFile(values.imageFile, managingPracticeId);
          imageS3Key = result.s3Key || result.key;
        } catch (err) {
          toast.error('Upload ảnh thất bại: ' + err.message);
          setSubmitting(false);
          setUploadingFile(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      // Upload audio if provided
      if (values.audioFile) {
        setUploadingFile(true);
        try {
          const result = await uploadFlashcardFile(values.audioFile, managingPracticeId);
          audioS3Key = result.s3Key || result.key;
        } catch (err) {
          toast.error('Upload audio thất bại: ' + err.message);
          setSubmitting(false);
          setUploadingFile(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      const payload = {
        front: values.front.trim(),
        back: values.back.trim(),
        example: values.example.trim() || '',
        orderIndex: practiceCards.length,
        imageS3Key: imageS3Key,
        audioS3Key: audioS3Key,
      };

      await createPracticeCard(managingPracticeId, payload);
      toast.success('Thêm thẻ thành công!');
      resetForm();
      await fetchPracticeCards(managingPracticeId);
    } catch (err) {
      toast.error(err.message || 'Thêm thẻ thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update card
  const handleUpdateCard = async (cardId, values) => {
    try {
      if (!managingPracticeId) return;

      const existingCard = practiceCards.find(c => (c.id || c.cardId) === cardId);
      let imageS3Key = existingCard?.image_s3_key || null;
      let audioS3Key = existingCard?.audio_s3_key || null;

      // Upload new image if provided
      if (values.imageFile) {
        setUploadingFile(true);
        try {
          const result = await uploadFlashcardFile(values.imageFile, managingPracticeId);
          imageS3Key = result.s3Key || result.key;
        } catch (err) {
          toast.error('Upload ảnh thất bại: ' + err.message);
          setUploadingFile(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      // Upload new audio if provided
      if (values.audioFile) {
        setUploadingFile(true);
        try {
          const result = await uploadFlashcardFile(values.audioFile, managingPracticeId);
          audioS3Key = result.s3Key || result.key;
        } catch (err) {
          toast.error('Upload audio thất bại: ' + err.message);
          setUploadingFile(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      const payload = {
        front: values.front.trim(),
        back: values.back.trim(),
        example: values.example.trim() || '',
        orderIndex: values.orderIndex,
        imageS3Key: imageS3Key,
        audioS3Key: audioS3Key,
      };

      await updatePracticeCard(managingPracticeId, cardId, payload);
      toast.success('Cập nhật thẻ thành công!');
      await fetchPracticeCards(managingPracticeId);
    } catch (err) {
      toast.error(err.message || 'Cập nhật thẻ thất bại.');
    }
  };

  // Handle delete card
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Bạn có chắc muốn xóa thẻ này?')) {
      return;
    }

    try {
      if (!managingPracticeId) return;
      await deletePracticeCard(managingPracticeId, cardId);
      toast.success('Xóa thẻ thành công!');
      await fetchPracticeCards(managingPracticeId);
    } catch (err) {
      toast.error(err.message || 'Xóa thẻ thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={26} className="text-indigo-600" />
            Quản lý Bài tập Flashcard
          </h2>
          <p className="text-slate-500 text-sm">
            Tạo và quản lý các bài tập flashcard cho học viên của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            Tạo bài tập
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Bộ lọc</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">Tất cả</option>
              <option value="vocabulary">Từ vựng</option>
              <option value="grammar">Ngữ pháp</option>
              <option value="pronunciation">Phát âm</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Chủ đề</label>
            <input
              type="text"
              placeholder="VD: animals, colors..."
              value={filters.topic}
              onChange={(e) =>
                setFilters({ ...filters, topic: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          {(filters.category || filters.topic) && (
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ category: '', topic: '' })}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <X size={16} />
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="h-4 w-24 bg-slate-100 rounded-full mb-4" />
              <div className="h-5 w-3/4 bg-slate-100 rounded-full mb-3" />
              <div className="h-4 w-full bg-slate-100 rounded-full mb-2" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm max-w-xl">
          {error}
        </div>
      )}

      {!loading && !error && filteredPractices.length === 0 && (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-500">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={26} className="text-indigo-500" />
          </div>
          <p className="font-medium mb-1">
            {searchTerm || filters.category || filters.topic
              ? 'Không tìm thấy bài tập nào phù hợp.'
              : 'Chưa có bài tập nào.'}
          </p>
          <p className="text-sm">
            {searchTerm || filters.category || filters.topic
              ? 'Hãy thử lại với từ khóa hoặc bộ lọc khác.'
              : 'Bắt đầu bằng việc tạo bài tập flashcard đầu tiên.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredPractices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPractices.map((practice) => (
            <div
              key={practice.id || practice.practiceId}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-100 transition-all relative flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4 flex-shrink-0">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 min-h-[3rem]">
                    {practice.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                    {practice.description || ' '}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                      practice.published
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                  >
                    {practice.published ? (
                      <>
                        <CheckCircle size={13} />
                        Công khai
                      </>
                    ) : (
                      <>
                        <XCircle size={13} />
                        Nháp
                      </>
                    )}
                  </span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === practice.id ? null : practice.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} className="text-gray-500" />
                    </button>
                    
                    {openMenuId === practice.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                          }}
                        ></div>
                        <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleManageCards(practice);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <FileText size={16} />
                            Quản lý thẻ
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(practice);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <Edit size={16} />
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublish(practice);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            {practice.published ? (
                              <>
                                <EyeOff size={16} />
                                Ẩn bài tập
                              </>
                            ) : (
                              <>
                                <Eye size={16} />
                                Công khai
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(practice.id || practice.practiceId);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 flex-1 flex flex-col justify-end">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Tag size={14} className="flex-shrink-0" />
                  <span className="font-medium">{practice.category}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText size={14} className="flex-shrink-0" />
                  <span>{practice.topic || 'Chưa có chủ đề'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Languages size={14} className="flex-shrink-0" />
                  <span>{practice.language?.toUpperCase() || 'EN'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {practice.cards?.length || 0} thẻ flashcard
                  </span>
                  <button
                    onClick={() => handleManageCards(practice)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Xem thẻ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO BÀI TẬP */}
      {isCreating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Tạo bài tập Flashcard mới
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tạo bài tập flashcard để học viên có thể ôn tập từ vựng
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <Formik
              initialValues={getInitialValues()}
              onSubmit={handleCreateSubmit}
              validate={(values) => {
                const errors = {};
                if (!values.title.trim()) {
                  errors.title = 'Tiêu đề là bắt buộc';
                }
                if (!values.description.trim()) {
                  errors.description = 'Mô tả là bắt buộc';
                }
                if (!values.topic.trim()) {
                  errors.topic = 'Chủ đề là bắt buộc';
                }
                if (!values.cards || values.cards.length === 0) {
                  errors.cards = 'Vui lòng thêm ít nhất một thẻ flashcard';
                }
                return errors;
              }}
            >
              {({ isSubmitting, values }) => (
                <Form className="px-6 py-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Tiêu đề <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        id="title"
                        name="title"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="VD: Từ vựng - Động vật cơ bản"
                      />
                      <ErrorMessage
                        name="title"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Mô tả <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="VD: Ôn tập từ vựng chủ đề động vật"
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="category"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Danh mục <span className="text-red-500">*</span>
                        </label>
                        <Field
                          as="select"
                          id="category"
                          name="category"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        >
                          <option value="vocabulary">Từ vựng</option>
                          <option value="grammar">Ngữ pháp</option>
                          <option value="pronunciation">Phát âm</option>
                        </Field>
                      </div>

                      <div>
                        <label
                          htmlFor="topic"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Chủ đề <span className="text-red-500">*</span>
                        </label>
                        <Field
                          type="text"
                          id="topic"
                          name="topic"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          placeholder="VD: animals"
                        />
                        <ErrorMessage
                          name="topic"
                          component="div"
                          className="text-red-500 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="language"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Ngôn ngữ <span className="text-red-500">*</span>
                        </label>
                        <Field
                          as="select"
                          id="language"
                          name="language"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        >
                          <option value="en">Tiếng Anh</option>
                          <option value="vi">Tiếng Việt</option>
                        </Field>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Field
                        id="published"
                        name="published"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="published"
                        className="text-sm text-gray-700"
                      >
                        Công khai ngay
                      </label>
                    </div>
                  </div>

                  {/* Flashcard Cards */}
                  <div className="border-t border-gray-200 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Thẻ Flashcard <span className="text-red-500">*</span>
                      </label>
                    </div>

                    <FieldArray name="cards">
                      {({ push, remove, form }) => (
                        <div className="space-y-4">
                          {form.values.cards.map((card, index) => (
                            <div
                              key={index}
                              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-gray-600">
                                  Thẻ #{index + 1}
                                </span>
                                {form.values.cards.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Mặt trước (Front)
                                  </label>
                                  <Field
                                    name={`cards.${index}.front`}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    placeholder="VD: dog"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Mặt sau (Back)
                                  </label>
                                  <Field
                                    name={`cards.${index}.back`}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    placeholder="VD: con chó"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Ví dụ (Example) - Tùy chọn
                                  </label>
                                  <Field
                                    name={`cards.${index}.example`}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    placeholder="VD: I have a dog."
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() =>
                              push({
                                front: '',
                                back: '',
                                example: '',
                                orderIndex: form.values.cards.length,
                              })
                            }
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus size={16} />
                            Thêm thẻ flashcard
                          </button>
                        </div>
                      )}
                    </FieldArray>
                    <ErrorMessage
                      name="cards"
                      component="div"
                      className="text-red-500 text-xs mt-2"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Đang tạo...' : 'Tạo bài tập'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA BÀI TẬP */}
      {isEditing && editingPractice && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Chỉnh sửa bài tập
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cập nhật thông tin bài tập flashcard
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingPractice(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <Formik
              initialValues={{
                title: editingPractice.title || '',
                description: editingPractice.description || '',
                category: editingPractice.category || 'vocabulary',
                topic: editingPractice.topic || '',
                language: editingPractice.language || 'en',
                published: editingPractice.published || false,
              }}
              onSubmit={handleEditSubmit}
              validate={(values) => {
                const errors = {};
                if (!values.title.trim()) {
                  errors.title = 'Tiêu đề là bắt buộc';
                }
                if (!values.description.trim()) {
                  errors.description = 'Mô tả là bắt buộc';
                }
                if (!values.topic.trim()) {
                  errors.topic = 'Chủ đề là bắt buộc';
                }
                return errors;
              }}
            >
              {({ isSubmitting }) => (
                <Form className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <Field
                      type="text"
                      name="title"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <ErrorMessage
                      name="title"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="category"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      >
                        <option value="vocabulary">Từ vựng</option>
                        <option value="grammar">Ngữ pháp</option>
                        <option value="pronunciation">Phát âm</option>
                      </Field>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chủ đề <span className="text-red-500">*</span>
                      </label>
                      <Field
                        type="text"
                        name="topic"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      />
                      <ErrorMessage
                        name="topic"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngôn ngữ <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="language"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      >
                        <option value="en">Tiếng Anh</option>
                        <option value="vi">Tiếng Việt</option>
                      </Field>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Field
                      name="published"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      Công khai
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingPractice(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save size={16} />
                      {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ THẺ */}
      {isManagingCards && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Quản lý thẻ Flashcard
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thêm, chỉnh sửa hoặc xóa thẻ flashcard
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManagingCards(false);
                  setManagingPracticeId(null);
                  setPracticeCards([]);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Form thêm thẻ mới */}
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-600" />
                  Thêm thẻ mới
                </h4>
                <Formik
                  initialValues={{
                    front: '',
                    back: '',
                    example: '',
                    imageFile: null,
                    audioFile: null,
                  }}
                  onSubmit={handleCreateCard}
                  validate={(values) => {
                    const errors = {};
                    if (!values.front.trim()) {
                      errors.front = 'Mặt trước là bắt buộc';
                    }
                    if (!values.back.trim()) {
                      errors.back = 'Mặt sau là bắt buộc';
                    }
                    return errors;
                  }}
                >
                  {({ isSubmitting, resetForm, setFieldValue, values }) => (
                    <Form className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Mặt trước <span className="text-red-500">*</span>
                          </label>
                          <Field
                            type="text"
                            name="front"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                            placeholder="VD: dog"
                          />
                          <ErrorMessage
                            name="front"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Mặt sau <span className="text-red-500">*</span>
                          </label>
                          <Field
                            type="text"
                            name="back"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                            placeholder="VD: con chó"
                          />
                          <ErrorMessage
                            name="back"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Ví dụ (Tùy chọn)
                          </label>
                          <Field
                            type="text"
                            name="example"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                            placeholder="VD: I have a dog."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Ảnh (Tùy chọn)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              setFieldValue('imageFile', file);
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          />
                          {values.imageFile && (
                            <p className="text-xs text-gray-500 mt-1">
                              Đã chọn: {values.imageFile.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Audio (Tùy chọn)
                          </label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              setFieldValue('audioFile', file);
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          />
                          {values.audioFile && (
                            <p className="text-xs text-gray-500 mt-1">
                              Đã chọn: {values.audioFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmitting || uploadingFile}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Plus size={16} />
                          {isSubmitting || uploadingFile ? 'Đang xử lý...' : 'Thêm thẻ'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>

              {/* Danh sách thẻ */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Danh sách thẻ ({practiceCards.length})
                </h4>
                {loadingCards ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="animate-spin mx-auto mb-2" size={24} />
                    <p>Đang tải...</p>
                  </div>
                ) : practiceCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
                    <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>Chưa có thẻ nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {practiceCards.map((card, index) => (
                      <CardItem
                        key={card.id || card.cardId}
                        card={card}
                        index={index}
                        onUpdate={handleUpdateCard}
                        onDelete={handleDeleteCard}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component Card Item với chức năng edit inline
function CardItem({ card, index, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    front: card.front || '',
    back: card.back || '',
    example: card.example || '',
    orderIndex: card.orderIndex || index,
    imageFile: null,
    audioFile: null,
  });

  const handleSave = () => {
    onUpdate(card.id || card.cardId, formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      front: card.front || '',
      back: card.back || '',
      example: card.example || '',
      orderIndex: card.orderIndex || index,
      imageFile: null,
      audioFile: null,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-indigo-700">
            Thẻ #{index + 1} - Đang chỉnh sửa
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mặt trước</label>
            <input
              type="text"
              value={formData.front}
              onChange={(e) => setFormData({ ...formData, front: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Mặt sau</label>
            <input
              type="text"
              value={formData.back}
              onChange={(e) => setFormData({ ...formData, back: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ví dụ</label>
            <input
              type="text"
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Ảnh {card.image_s3_key && <span className="text-gray-400">(Có file hiện tại)</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] || null })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
            {formData.imageFile && (
              <p className="text-xs text-gray-500 mt-1">
                File mới: {formData.imageFile.name}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Audio {card.audio_s3_key && <span className="text-gray-400">(Có file hiện tại)</span>}
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFormData({ ...formData, audioFile: e.target.files[0] || null })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
            {formData.audioFile && (
              <p className="text-xs text-gray-500 mt-1">
                File mới: {formData.audioFile.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <Save size={14} />
            Lưu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:border-indigo-200 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-600">
          Thẻ #{index + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(card.id || card.cardId)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mặt trước</label>
          <p className="text-sm font-medium text-gray-900">{card.front || '-'}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mặt sau</label>
          <p className="text-sm font-medium text-gray-900">{card.back || '-'}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ví dụ</label>
          <p className="text-sm text-gray-600">{card.example || '-'}</p>
        </div>
      </div>
    </div>
  );
}
