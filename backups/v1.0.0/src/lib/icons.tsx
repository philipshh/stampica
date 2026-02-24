import {
    MdStar, MdFavorite, MdMovie, MdTheaters, MdTv, MdMusicNote,
    MdCameraAlt, MdVideocam, MdPerson, MdGroups, MdPublic, MdLanguage,
    MdAccessTime, MdCalendarToday, MdEmojiEvents, MdGrade,
    MdInfo, MdWarning, MdCheckCircle, MdCancel, MdLocalMovies,
    MdHd, MdClosedCaption, MdSurroundSound, Md4K, MdLocalPlay, MdMic
} from 'react-icons/md';

export const ICON_MAP = {
    'star': MdStar,
    'favorite': MdFavorite,
    'movie': MdMovie,
    'theaters': MdTheaters,
    'tv': MdTv,
    'music': MdMusicNote,
    'camera': MdCameraAlt,
    'videocam': MdVideocam,
    'person': MdPerson,
    'groups': MdGroups,
    'public': MdPublic,
    'language': MdLanguage,
    'time': MdAccessTime,
    'calendar': MdCalendarToday,
    'trophy': MdEmojiEvents,
    'grade': MdGrade,
    'info': MdInfo,
    'warning': MdWarning,
    'check': MdCheckCircle,
    'cancel': MdCancel,
    'film': MdLocalMovies,
    'hd': MdHd,
    'cc': MdClosedCaption,
    'sound': MdSurroundSound,
    '4k': Md4K,
    'ticket': MdLocalPlay,
    'mic': MdMic
};

export type IconName = keyof typeof ICON_MAP;

export const getIconComponent = (name: string) => {
    return ICON_MAP[name as IconName] || MdStar;
};
