import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  name: string;
  avatarUrl: string | null;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateAvatar: (url: string | null) => void;
  updateName: (name: string) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    avatarUrl: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          name: data.name,
          avatarUrl: data.avatar_url,
        });
      }
    };

    fetchProfile();
  }, []);

  const updateAvatar = (url: string | null) => {
    setProfile((prev) => ({ ...prev, avatarUrl: url }));
  };

  const updateName = (name: string) => {
    setProfile((prev) => ({ ...prev, name }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateAvatar, updateName }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
