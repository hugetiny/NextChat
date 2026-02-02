import { IconButton } from "@/app/components/button";
import ReturnIcon from "@/app/icons/return.svg";
import Locale from "@/app/locales";
import { Path } from "@/app/constant";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  copyToClipboard,
  getMessageTextContent,
  useMobileScreen,
} from "@/app/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppConfig } from "@/app/store";
import MinIcon from "@/app/icons/min.svg";
import MaxIcon from "@/app/icons/max.svg";
import { getClientConfig } from "@/app/config/client";
import { ChatAction } from "@/app/components/chat";
import DeleteIcon from "@/app/icons/clear.svg";
import CopyIcon from "@/app/icons/copy.svg";
import PromptIcon from "@/app/icons/prompt.svg";
import ResetIcon from "@/app/icons/reload.svg";
import { useSdStore } from "@/app/store/sd";
import LoadingIcon from "@/app/icons/three-dots.svg";
import ErrorIcon from "@/app/icons/delete.svg";
import SDIcon from "@/app/icons/sd.svg";
import { Property } from "csstype";
import {
  showConfirm,
  showImageModal,
  showModal,
} from "@/app/components/ui-lib";
import { removeImage } from "@/app/utils/chat";
import { SideBar } from "./sd-sidebar";
import { WindowContent } from "@/app/components/home";
import { params } from "./sd-panel";
import clsx from "clsx";

function getSdTaskStatus(item: any) {
  let s: string;
  let color: Property.Color | undefined = undefined;
  switch (item.status) {
    case "success":
      s = Locale.Sd.Status.Success;
      color = "green";
      break;
    case "error":
      s = Locale.Sd.Status.Error;
      color = "red";
      break;
    case "wait":
      s = Locale.Sd.Status.Wait;
      color = "yellow";
      break;
    case "running":
      s = Locale.Sd.Status.Running;
      color = "blue";
      break;
    default:
      s = item.status.toUpperCase();
  }
  return (
    <p className={"line-1"} title={item.error} style={{ color: color }}>
      <span>
        {Locale.Sd.Status.Name}: {s}
      </span>
      {item.status === "error" && (
        <span
          className="clickable"
          onClick={() => {
            showModal({
              title: Locale.Sd.Detail,
              children: (
                <div style={{ color: color, userSelect: "text" }}>
                  {item.error}
                </div>
              ),
            });
          }}
        >
          - {item.error}
        </span>
      )}
    </p>
  );
}

export function Sd() {
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const location = useLocation();
  const clientConfig = useMemo(() => getClientConfig(), []);
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;
  const config = useAppConfig();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sdStore = useSdStore();
  const [sdImages, setSdImages] = useState(sdStore.draw);
  const isSd = location.pathname === Path.Sd;

  useEffect(() => {
    setSdImages(sdStore.draw);
  }, [sdStore.currentId]);

  return (
    <>
      <SideBar className={clsx({ ["sidebar-show"]: isSd })} />
      <WindowContent>
        <div className={"chat"} key={"1"}>
          <div
            className="flex justify-between items-center p-5 border-b border-border relative select-none"
            data-tauri-drag-region
          >
            {isMobileScreen && (
              <div className="flex gap-2">
                <div className="flex items-center justify-center">
                  <IconButton
                    icon={<ReturnIcon />}
                    bordered
                    title={Locale.Chat.Actions.ChatList}
                    onClick={() => navigate(Path.Sd)}
                  />
                </div>
              </div>
            )}
            <div
              className={clsx(
                "flex flex-col overflow-hidden max-w-[calc(100%-100px)]",
                "chat-body-title",
              )}
            >
              <div className="text-xl font-bold truncate block max-w-[50vw]">
                Stability AI
              </div>
              <div className="text-sm text-muted-foreground">
                {Locale.Sd.SubTitle(sdImages.length || 0)}
              </div>
            </div>

            <div className="flex gap-2">
              {showMaxIcon && (
                <div className="flex items-center justify-center">
                  <IconButton
                    aria={Locale.Chat.Actions.FullScreen}
                    icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                    bordered
                    onClick={() => {
                      config.update(
                        (config) => (config.tightBorder = !config.tightBorder),
                      );
                    }}
                  />
                </div>
              )}
              {isMobileScreen && <SDIcon width={50} height={50} />}
            </div>
          </div>
          <div className={"chat-body"} ref={scrollRef}>
            <div className={"sd-img-list"}>
              {sdImages.length > 0 ? (
                sdImages.map((item: any) => {
                  return (
                    <div
                      key={item.id}
                      style={{ display: "flex" }}
                      className={"sd-img-item"}
                    >
                      {item.status === "success" ? (
                        <img
                          className={"img"}
                          src={item.img_data}
                          alt={item.id}
                          onClick={(e) =>
                            showImageModal(
                              item.img_data,
                              true,
                              isMobileScreen
                                ? { width: "100%", height: "fit-content" }
                                : { maxWidth: "100%", maxHeight: "100%" },
                              isMobileScreen
                                ? { width: "100%", height: "fit-content" }
                                : { width: "100%", height: "100%" },
                            )
                          }
                        />
                      ) : item.status === "error" ? (
                        <div className={"pre-img"}>
                          <ErrorIcon />
                        </div>
                      ) : (
                        <div className={"pre-img"}>
                          <LoadingIcon />
                        </div>
                      )}
                      <div
                        style={{ marginLeft: "10px" }}
                        className={"sd-img-item-info"}
                      >
                        <p className={"line-1"}>
                          {Locale.SdPanel.Prompt}:{" "}
                          <span
                            className="clickable"
                            title={item.params.prompt}
                            onClick={() => {
                              showModal({
                                title: Locale.Sd.Detail,
                                children: (
                                  <div style={{ userSelect: "text" }}>
                                    {item.params.prompt}
                                  </div>
                                ),
                              });
                            }}
                          >
                            {item.params.prompt}
                          </span>
                        </p>
                        <p>
                          {Locale.SdPanel.AIModel}: {item.model_name}
                        </p>
                        {getSdTaskStatus(item)}
                        <p>{item.created_at}</p>
                        <div className={"chat-message-actions"}>
                          <div
                            className={
                              "flex flex-wrap gap-2 w-full justify-start items-center relative"
                            }
                          >
                            <ChatAction
                              text={Locale.Sd.Actions.Params}
                              icon={<PromptIcon />}
                              onClick={() => {
                                showModal({
                                  title: Locale.Sd.GenerateParams,
                                  children: (
                                    <div style={{ userSelect: "text" }}>
                                      {Object.keys(item.params).map((key) => {
                                        let label = key;
                                        let value = item.params[key];
                                        switch (label) {
                                          case "prompt":
                                            label = Locale.SdPanel.Prompt;
                                            break;
                                          case "negative_prompt":
                                            label =
                                              Locale.SdPanel.NegativePrompt;
                                            break;
                                          case "aspect_ratio":
                                            label = Locale.SdPanel.AspectRatio;
                                            break;
                                          case "seed":
                                            label = "Seed";
                                            value = value || 0;
                                            break;
                                          case "output_format":
                                            label = Locale.SdPanel.OutFormat;
                                            value = value?.toUpperCase();
                                            break;
                                          case "style":
                                            label = Locale.SdPanel.ImageStyle;
                                            value = params
                                              .find(
                                                (item) =>
                                                  item.value === "style",
                                              )
                                              ?.options?.find(
                                                (item) => item.value === value,
                                              )?.name;
                                            break;
                                          default:
                                            break;
                                        }

                                        return (
                                          <div
                                            key={key}
                                            style={{ margin: "10px" }}
                                          >
                                            <strong>{label}: </strong>
                                            {value}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ),
                                });
                              }}
                            />
                            <ChatAction
                              text={Locale.Sd.Actions.Copy}
                              icon={<CopyIcon />}
                              onClick={() =>
                                copyToClipboard(
                                  getMessageTextContent({
                                    role: "user",
                                    content: item.params.prompt,
                                  }),
                                )
                              }
                            />
                            <ChatAction
                              text={Locale.Sd.Actions.Retry}
                              icon={<ResetIcon />}
                              onClick={() => {
                                const reqData = {
                                  model: item.model,
                                  model_name: item.model_name,
                                  status: "wait",
                                  params: { ...item.params },
                                  created_at: new Date().toLocaleString(),
                                  img_data: "",
                                };
                                sdStore.sendTask(reqData);
                              }}
                            />
                            <ChatAction
                              text={Locale.Sd.Actions.Delete}
                              icon={<DeleteIcon />}
                              onClick={async () => {
                                if (
                                  await showConfirm(Locale.Sd.Danger.Delete)
                                ) {
                                  // remove img_data + remove item in list
                                  removeImage(item.img_data).finally(() => {
                                    sdStore.draw = sdImages.filter(
                                      (i: any) => i.id !== item.id,
                                    );
                                    sdStore.getNextId();
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div>{Locale.Sd.EmptyRecord}</div>
              )}
            </div>
          </div>
        </div>
      </WindowContent>
    </>
  );
}
