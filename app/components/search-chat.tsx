import { useState, useEffect, useRef, useCallback } from "react";
import { ErrorBoundary } from "./error";
import { useNavigate } from "react-router-dom";
import { IconButton } from "./button";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import Locale from "../locales";
import { Path } from "../constant";

import { useChatStore } from "../store";

type Item = {
  id: number;
  name: string;
  content: string;
};
export function SearchChatPage() {
  const navigate = useNavigate();

  const chatStore = useChatStore();

  const sessions = chatStore.sessions;
  const selectSession = chatStore.selectSession;

  const [searchResults, setSearchResults] = useState<Item[]>([]);

  const previousValueRef = useRef<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const doSearch = useCallback((text: string) => {
    const lowerCaseText = text.toLowerCase();
    const results: Item[] = [];

    sessions.forEach((session, index) => {
      const fullTextContents: string[] = [];

      session.messages.forEach((message) => {
        const content = message.content as string;
        if (!content.toLowerCase || content === "") return;
        const lowerCaseContent = content.toLowerCase();

        // full text search
        let pos = lowerCaseContent.indexOf(lowerCaseText);
        while (pos !== -1) {
          const start = Math.max(0, pos - 35);
          const end = Math.min(content.length, pos + lowerCaseText.length + 35);
          fullTextContents.push(content.substring(start, end));
          pos = lowerCaseContent.indexOf(
            lowerCaseText,
            pos + lowerCaseText.length,
          );
        }
      });

      if (fullTextContents.length > 0) {
        results.push({
          id: index,
          name: session.topic,
          content: fullTextContents.join("... "), // concat content with...
        });
      }
    });

    // sort by length of matching content
    results.sort((a, b) => b.content.length - a.content.length);

    return results;
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (searchInputRef.current) {
        const currentValue = searchInputRef.current.value;
        if (currentValue !== previousValueRef.current) {
          if (currentValue.length > 0) {
            const result = doSearch(currentValue);
            setSearchResults(result);
          }
          previousValueRef.current = currentValue;
        }
      }
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [doSearch]);

  return (
    <ErrorBoundary>
      <div className={"mask-page"}>
        {/* header */}
        <div className="flex justify-between items-center p-5 border-b border-border relative select-none">
          <div className="flex flex-col overflow-hidden max-w-[calc(100%-100px)]">
            <div className="text-xl font-bold truncate block max-w-[50vw]">
              {Locale.SearchChat.Page.Title}
            </div>
            <div className="text-sm text-muted-foreground">
              {Locale.SearchChat.Page.SubTitle(searchResults.length)}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center justify-center">
              <IconButton
                icon={<CloseIcon />}
                bordered
                onClick={() => navigate(-1)}
              />
            </div>
          </div>
        </div>

        <div className={"mask-page-body"}>
          <div className={"mask-filter"}>
            {/**搜索输入框 */}
            <input
              type="text"
              className={"search-bar"}
              placeholder={Locale.SearchChat.Page.Search}
              autoFocus
              ref={searchInputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const searchText = e.currentTarget.value;
                  if (searchText.length > 0) {
                    const result = doSearch(searchText);
                    setSearchResults(result);
                  }
                }
              }}
            />
          </div>

          <div>
            {searchResults.map((item) => (
              <div
                className={"mask-item"}
                key={item.id}
                onClick={() => {
                  navigate(Path.Chat);
                  selectSession(item.id);
                }}
                style={{ cursor: "pointer" }}
              >
                {/** 搜索匹配的文本 */}
                <div className={"mask-header"}>
                  <div className={"mask-title"}>
                    <div className={"mask-name"}>{item.name}</div>
                    {item.content.slice(0, 70)}
                  </div>
                </div>
                {/** 操作按钮 */}
                <div className={"mask-actions"}>
                  <IconButton
                    icon={<EyeIcon />}
                    text={Locale.SearchChat.Item.View}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
