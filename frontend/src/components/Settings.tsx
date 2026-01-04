import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  MapPin,
  Monitor,
  Building,
  Globe,
  Loader,
  CheckCircle,
  Code,
  Smartphone,
  BarChart3,
  Bitcoin,
  Server,
  Palette,
  PenTool,
  Video,
  Layers,
  Home,
  Zap,
  Wrench,
  Settings as SettingsIcon,
  Target,
  Megaphone,
  Scale,
  Calculator,
} from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import SkillBridgeABI from '../abi/SkillBridge.json';

const contractAddress = '0x62D61B40CD9C7a00ed6c80118fEC082da83726b8';

const skillCategoryEnum: { [key: string]: number } = {
    WebDevelopment: 0,
    MobileDevelopment: 1,
    DataScience: 2,
    BlockchainDev: 3,
    DevOps: 4,
    GraphicDesign: 5,
    ContentWriting: 6,
    VideoEditing: 7,
    UIUXDesign: 8,
    Construction: 9,
    Electrical: 10,
    Plumbing: 11,
    HomeMaintenance: 12,
    BusinessStrategy: 13,
    Marketing: 14,
    LegalServices: 15,
    FinancialPlanning: 16,
  };
  
  const workTypeEnum: { [key: string]: number } = {
    Remote: 0,
    Physical: 1,
    Both: 2,
  };

  const skillCategories = [
    { id: 'WebDevelopment', name: 'Web Development', icon: <Code className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
    { id: 'MobileDevelopment', name: 'Mobile Development', icon: <Smartphone className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
    { id: 'DataScience', name: 'Data Science', icon: <BarChart3 className="w-5 h-5" />, color: 'from-purple-500 to-indigo-500' },
    { id: 'BlockchainDev', name: 'Blockchain Development', icon: <Bitcoin className="w-5 h-5" />, color: 'from-yellow-500 to-orange-500' },
    { id: 'DevOps', name: 'DevOps', icon: <Server className="w-5 h-5" />, color: 'from-gray-500 to-slate-500' },
    { id: 'GraphicDesign', name: 'Graphic Design', icon: <Palette className="w-5 h-5" />, color: 'from-pink-500 to-rose-500' },
    { id: 'ContentWriting', name: 'Content Writing', icon: <PenTool className="w-5 h-5" />, color: 'from-teal-500 to-cyan-500' },
    { id: 'VideoEditing', name: 'Video Editing', icon: <Video className="w-5 h-5" />, color: 'from-red-500 to-pink-500' },
    { id: 'UIUXDesign', name: 'UI/UX Design', icon: <Layers className="w-5 h-5" />, color: 'from-indigo-500 to-purple-500' },
    { id: 'Construction', name: 'Construction', icon: <Home className="w-5 h-5" />, color: 'from-amber-500 to-orange-500' },
    { id: 'Electrical', name: 'Electrical', icon: <Zap className="w-5 h-5" />, color: 'from-yellow-400 to-yellow-500' },
    { id: 'Plumbing', name: 'Plumbing', icon: <Wrench className="w-5 h-5" />, color: 'from-blue-600 to-blue-500' },
    { id: 'HomeMaintenance', name: 'Home Maintenance', icon: <SettingsIcon className="w-5 h-5" />, color: 'from-gray-600 to-gray-500' },
    { id: 'BusinessStrategy', name: 'Business Strategy', icon: <Target className="w-5 h-5" />, color: 'from-emerald-500 to-green-500' },
    { id: 'Marketing', name: 'Marketing', icon: <Megaphone className="w-5 h-5" />, color: 'from-orange-500 to-red-500' },
    { id: 'LegalServices', name: 'Legal Services', icon: <Scale className="w-5 h-5" />, color: 'from-slate-600 to-gray-600' },
    { id: 'FinancialPlanning', name: 'Financial Planning', icon: <Calculator className="w-5 h-5" />, color: 'from-green-600 to-emerald-600' }
  ];
  
  const workTypes = [
    { id: 'Remote', name: 'Remote', icon: <Monitor className="w-6 h-6" /> },
    { id: 'Physical', name: 'On-site', icon: <Building className="w-6 h-6" /> },
    { id: 'Both', name: 'Hybrid', icon: <Globe className="w-6 h-6" /> }
  ];

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  location: z.string().min(2, 'Location is required'),
  workType: z.string(),
  skillCategories: z.array(z.string()).min(1, 'Select at least one skill'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface SettingsProps {
  initialData: {
    name: string;
    email: string;
    location: string;
    workType: number;
    skillCategories: number[];
  };
}

const SettingsPage: React.FC<SettingsProps> = ({ initialData }) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      location: initialData.location,
      workType: Object.keys(workTypeEnum).find(key => workTypeEnum[key] === initialData.workType) || 'Remote',
      skillCategories: initialData.skillCategories.map(num => Object.keys(skillCategoryEnum).find(key => skillCategoryEnum[key] === num) || ''),
    },
  });

  const { data: hash, error, isPending: isLoading, writeContract } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash });

  const onSubmit = (data: ProfileFormData) => {
    const args = [
      data.name,
      data.email,
      data.skillCategories.map(skill => skillCategoryEnum[skill]),
      data.location,
      workTypeEnum[data.workType],
    ];
    
    writeContract({
      address: contractAddress,
      abi: SkillBridgeABI,
      functionName: 'updateProfile',
      args,
    });
  };

  const selectedSkills = watch('skillCategories');

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/50">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input {...field} className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200" />
                </div>
              )}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input {...field} className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200" />
                </div>
              )}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
        </div>

        {/* Location Field */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input {...field} className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200" />
              </div>
            )}
          />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
        </div>

        {/* Work Type */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Work Type</label>
          <Controller
            name="workType"
            control={control}
            render={({ field }) => (
              <div className="grid md:grid-cols-3 gap-4">
                {workTypes.map(type => (
                  <div
                    key={type.id}
                    onClick={() => setValue('workType', type.id)}
                    className={`cursor-pointer rounded-xl p-4 text-center border-2 ${field.value === type.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                  >
                    {type.icon}
                    <h3 className="font-semibold mt-2">{type.name}</h3>
                  </div>
                ))}
              </div>
            )}
          />
        </div>

        {/* Skill Categories */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Skills</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {skillCategories.map(skill => (
              <div
                key={skill.id}
                onClick={() => {
                  const currentSkills = selectedSkills || [];
                  const newSkills = currentSkills.includes(skill.id)
                    ? currentSkills.filter(s => s !== skill.id)
                    : [...currentSkills, skill.id];
                  setValue('skillCategories', newSkills, { shouldValidate: true });
                }}
                className={`cursor-pointer rounded-xl p-4 text-center border-2 ${selectedSkills?.includes(skill.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
              >
                {skill.icon}
                <h3 className="font-semibold text-sm mt-2">{skill.name}</h3>
              </div>
            ))}
          </div>
          {errors.skillCategories && <p className="text-red-500 text-sm mt-1">{errors.skillCategories.message}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || isTxLoading || isTxSuccess}
            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600"
          >
            {isLoading || isTxLoading ? (
              <><Loader className="animate-spin w-5 h-5 mr-2" /> Saving...</>
            ) : isTxSuccess ? (
              <><CheckCircle className="w-5 h-5 mr-2" /> Saved!</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-2 text-right">
            Error: {error?.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
