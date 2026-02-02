import { IconButton } from "./button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Path, SAAS_CHAT_URL } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";
import Delete from "../icons/close.svg";
import Arrow from "../icons/arrow.svg";
import Logo from "../icons/logo.svg";
import { useMobileScreen } from "@/app/utils";
import BotIcon from "../icons/bot.svg";
import { getClientConfig } from "../config/client";
import { PasswordInput } from "./ui-lib";
import LeftIcon from "@/app/icons/left.svg";
import { safeLocalStorage } from "@/app/utils";
import {
  trackSettingsPageGuideToCPaymentClick,
  trackAuthorizationPageButtonToCPaymentClick,
} from "../utils/auth-settings-events";
import { cn } from "../lib/utils";

const storage = safeLocalStorage();

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const goHome = () => navigate(Path.Home);
  const goChat = () => navigate(Path.Chat);
  const goSaas = () => {
    trackAuthorizationPageButtonToCPaymentClick();
    window.location.href = SAAS_CHAT_URL;
  };

  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
    });
  };

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex justify-start items-center h-full w-full flex-col">
      <TopBanner></TopBanner>
      <div className="flex justify-between w-full p-2.5 box-border animate-slide-in-from-top">
        <IconButton
          icon={<LeftIcon />}
          text={Locale.Auth.Return}
          onClick={() => navigate(Path.Home)}
        ></IconButton>
      </div>
      <div className={cn("no-dark mt-[10vh] scale-140")}>
        <BotIcon />
      </div>

      <div className="text-2xl font-bold leading-[2] mb-[1vh]">
        {Locale.Auth.Title}
      </div>
      <div className="text-sm">{Locale.Auth.Tips}</div>

      <PasswordInput
        style={{ marginTop: "3vh", marginBottom: "3vh" }}
        aria={Locale.Settings.ShowPassword}
        aria-label={Locale.Auth.Input}
        value={accessStore.accessCode}
        type="text"
        placeholder={Locale.Auth.Input}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.accessCode = e.currentTarget.value),
          );
        }}
      />

      {!accessStore.hideUserApiKey ? (
        <>
          <div className="text-sm">{Locale.Auth.SubTips}</div>
          <PasswordInput
            style={{ marginTop: "3vh", marginBottom: "3vh" }}
            aria={Locale.Settings.ShowPassword}
            aria-label={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
            value={accessStore.openaiApiKey}
            type="text"
            placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
            onChange={(e) => {
              accessStore.update(
                (access) => (access.openaiApiKey = e.currentTarget.value),
              );
            }}
          />
          <PasswordInput
            style={{ marginTop: "3vh", marginBottom: "3vh" }}
            aria={Locale.Settings.ShowPassword}
            aria-label={Locale.Settings.Access.Google.ApiKey.Placeholder}
            value={accessStore.googleApiKey}
            type="text"
            placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
            onChange={(e) => {
              accessStore.update(
                (access) => (access.googleApiKey = e.currentTarget.value),
              );
            }}
          />
        </>
      ) : null}

      <div className="flex justify-center flex-col gap-2.5">
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={goChat}
        />
        <IconButton
          text={Locale.Auth.SaasTips}
          onClick={() => {
            goSaas();
          }}
        />
      </div>
    </div>
  );
}

function TopBanner() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useMobileScreen();
  useEffect(() => {
    const bannerDismissed = storage.getItem("bannerDismissed");
    if (!bannerDismissed) {
      storage.setItem("bannerDismissed", "false");
      setIsVisible(true);
    } else if (bannerDismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClose = () => {
    setIsVisible(false);
    storage.setItem("bannerDismissed", "true");
  };

  if (!isVisible) {
    return null;
  }
  return (
    <div
      className="relative w-full flex justify-center items-center py-3 px-16 box-border bg-second sm:px-3 sm:py-3"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "flex justify-center items-center text-sm leading-[150%] no-dark",
        )}
      >
        <Logo className="mr-2 sm:mr-2"></Logo>
        <span className="gap-2">
          {Locale.Auth.TopTips}
          <a
            href={SAAS_CHAT_URL}
            rel="stylesheet"
            onClick={() => {
              trackSettingsPageGuideToCPaymentClick();
            }}
            className="inline-flex items-center no-underline ml-2 text-primary"
          >
            {Locale.Settings.Access.SaasStart.ChatNow}
            <Arrow style={{ marginLeft: "4px" }} />
          </a>
        </span>
      </div>
      {(isHovered || isMobile) && (
        <Delete
          className="cursor-pointer absolute top-1/2 right-12 -translate-y-1/2 sm:right-2.5"
          onClick={handleClose}
        />
      )}
    </div>
  );
}
