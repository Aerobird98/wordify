/** @jsx h */
import { h, render } from "preact";
import { useMemo, useState, useCallback } from "preact/hooks";
import { createEditor, Transforms, Editor, Node, Text, Range } from "slate";
import { Slate, useSlate, Editable, withReact } from "slate-react";
import { withHistory, HistoryEditor } from "slate-history";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faExpand,
  faUndo,
  faRedo,
  faPrint,
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faRemoveFormat,
  faParagraph,
  faHeading,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faAlignJustify,
} from "@fortawesome/free-solid-svg-icons";

import { Box, Button, Styled, ThemeProvider } from "theme-ui";

const Themes = {
  flow: {
    space: [0, 4, 8, 16, 24, 48],
    breakpoints: [576, 768, 992, 1200],
    colors: {
      text: "#212529",
      background: "#fff",
      primary: "#007bff",
      secondary: "#6c757d",
      accent: "",
      highlight: "#b5d5fc",
      muted: "#dee2e6",
    },
    fonts: {
      body: "'Quicksand', Arial, Helvetica, sans-serif",
      heading: "inherit",
      monospace: "'Fira code', Courier, monospace",
    },
    fontSizes: [12, 14, 16, 20, 24, 32, 48, 64],
    fontWeights: {
      light: 300,
      body: 400,
      heading: 500,
      bold: 700,
    },
    lineHeights: {
      body: 1.5,
      heading: 1.2,
    },
    text: {
      heading: {
        fontFamily: "heading",
        fontWeight: "heading",
        lineHeight: "heading",
      },
    },
    styles: {
      root: {
        fontFamily: "body",
        lineHeight: "body",
        fontWeight: "body",
      },
      p: {},
      h1: {
        variant: "text.heading",
        fontSize: 7,
      },
      h2: {
        variant: "text.heading",
        fontSize: 6,
      },
      h3: {
        variant: "text.heading",
        fontSize: 5,
      },
      h4: {
        variant: "text.heading",
        fontSize: 4,
      },
      h5: {
        variant: "text.heading",
        fontSize: 3,
      },
      h6: {
        variant: "text.heading",
        fontSize: 2,
      },
      div: {
        fontFamily: "monospace",
      },
    },
  },
};

// If you want your app to work offline and load faster, you can uncoment
// the code below. Note this comes with some pitfalls.
// See the serviceWorker.js script for details.
//import * as serviceWorker from "./serviceWorker.js";

const FlowEditor = {
  // Define a serializing function that takes a value and
  // returns the string content of each node in the value's children
  // then joins them all with line breaks denoting paragraphs.
  serializePlainText(value) {
    return value.map((n) => Node.string(n)).join("\n");
  },

  // Define a deserializing function that takes a string and
  // returns a value as an array of children derived by splitting the string.
  deserializePlainText(string) {
    return string.split("\n").map((paragraph) => {
      return {
        children: [{ text: paragraph }],
      };
    });
  },

  isMarkActive(editor, format) {
    const selection = FlowEditor.isSelectionActive(editor);
    const [match] = Editor.nodes(editor, {
      match: (n) => n[format] === true,
    });

    return selection ? !!match : false;
  },

  isBlockActive(editor, format) {
    const [match] = Editor.nodes(editor, {
      match: (n) => n.type === format,
    });

    return !!match;
  },

  isAlignActive(editor, format) {
    const [match] = Editor.nodes(editor, {
      match: (n) => n.align === format,
    });

    return !!match;
  },

  isSelectionActive(editor) {
    const { selection } = editor;
    return selection && !Range.isCollapsed(selection);
  },

  isfullscreenActive() {
    return !!(
      window.document.fullscreenElement ||
      window.document.mozFullScreenElement ||
      window.document.webkitFullscreenElement ||
      window.document.msFullscreenElement
    );
  },

  toggleMark(editor, format) {
    const active = FlowEditor.isMarkActive(editor, format);
    const selection = FlowEditor.isSelectionActive(editor);

    if (selection) {
      Transforms.setNodes(
        editor,
        {
          [format]: active ? null : true,
        },
        {
          match: (n) => Text.isText(n),
          split: true,
        }
      );
    }
  },

  toggleBlock(editor, format) {
    const active = FlowEditor.isBlockActive(editor, format);

    Transforms.setNodes(
      editor,
      {
        type: active ? null : format,
      },
      {
        match: (n) => Editor.isBlock(editor, n),
      }
    );
  },

  toggleAlign(editor, format) {
    const active = FlowEditor.isAlignActive(editor, format);

    Transforms.setNodes(
      editor,
      {
        align: active ? null : format,
      },
      {
        match: (n) => Editor.isBlock(editor, n),
      }
    );
  },

  toggleFullscreen() {
    const element = window.document.documentElement;

    if (FlowEditor.isfullscreenActive()) {
      if (window.document.exitFullscreen) {
        window.document.exitFullscreen();
      } else if (window.document.mozCancelFullScreen) {
        window.document.mozCancelFullScreen();
      } else if (window.document.webkitExitFullscreen) {
        window.document.webkitExitFullscreen();
      } else if (window.document.msExitFullscreen) {
        window.document.msExitFullscreen();
      }
    } else {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    }
  },

  isUrlValid(url) {
    return /^(ftp|http|https):\/\/[^ "]+$/.test(url);
  },

  isOnMac() {
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
  },

  print() {
    return window.print();
  },

  save(key, value) {
    return window.localStorage.setItem(key, JSON.stringify(value));
  },

  load(key) {
    return JSON.parse(window.localStorage.getItem(key));
  },
};

const withFlow = (editor) => {
  return editor;
};

const Root = (props) => {
  return (
    <ThemeProvider theme={Themes.flow}>
      <Flow>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            "@media print": {
              display: "block",
            },
          }}
          {...props}
        >
          <Toolbox>
            <FullscreenButton />
            <UndoButton />
            <RedoButton />
            <PrintButton />
            <MarkButton format="bold" icon="bold" label="Bold" />
            <MarkButton format="italic" icon="italic" label="Italic" />
            <MarkButton format="underline" icon="underline" label="Underline" />
            <MarkButton
              format="strikethrough"
              icon="strikethrough"
              label="Strikethrough"
            />
            <BlockButton
              format="paragraph"
              icon="paragraph"
              label="Paragraph"
            />
            <BlockButton
              format="heading-six"
              icon="heading"
              label="Heading 6"
            />
            <BlockButton
              format="heading-five"
              icon="heading"
              label="Heading 5"
            />
            <BlockButton
              format="heading-four"
              icon="heading"
              label="Heading 4"
            />
            <BlockButton
              format="heading-three"
              icon="heading"
              label="Heading 3"
            />
            <BlockButton
              format="heading-two"
              icon="heading"
              label="Heading 2"
            />
            <BlockButton
              format="heading-one"
              icon="heading"
              label="Heading 1"
            />
            <AlignButton format="left" icon="align-left" label="Left" />
            <AlignButton format="center" icon="align-center" label="Center" />
            <AlignButton format="right" icon="align-right" label="Right" />
            <AlignButton
              format="justify"
              icon="align-justify"
              label="Justify"
            />
          </Toolbox>
          <Textbox />
        </Box>
      </Flow>
    </ThemeProvider>
  );
};

const Leaf = (props) => {
  const { attributes, leaf } = props;
  let { children } = props;

  if (leaf.bold) {
    children = <b>{children}</b>;
  }

  if (leaf.italic) {
    children = <i>{children}</i>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  if (leaf.strikethrough) {
    children = <s>{children}</s>;
  }

  return <span {...attributes}>{children}</span>;
};

const Element = (props) => {
  const { attributes, children, element } = props;

  switch (element.type) {
    case "paragraph":
      return (
        <Box
          as={Styled.p}
          mb={3}
          sx={{
            textAlign: element.align,
          }}
          {...attributes}
        >
          {children}
        </Box>
      );
    case "heading-one":
      return (
        <Box
          as={Styled.h1}
          mb={2}
          sx={{
            textAlign: element.align,
          }}
          {...attributes}
        >
          {children}
        </Box>
      );
    case "heading-two":
      return (
        <Box
          as={Styled.h2}
          mb={2}
          sx={{
            textAlign: element.align,
          }}
          {...attributes}
        >
          {children}
        </Box>
      );
    case "heading-three":
      return (
        <Box
          as={Styled.h3}
          mb={2}
          sx={{
            textAlign: element.align,
          }}
          {...attributes}
        >
          {children}
        </Box>
      );
    case "heading-four":
      return (
        <Box
          as={Styled.h4}
          mb={2}
          sx={{
            textAlign: element.align,
          }}
          {...attributes}
        >
          {children}
        </Box>
      );
    case "heading-five":
      return (
        <Box
          as={Styled.h5}
          mb={2}
          sx={{
            textAlign: element.align,
          }}
          {...attributes}
        >
          {children}
        </Box>
      );
    case "heading-six":
      return (
        <Box
          as={Styled.h6}
          mb={2}
          sx={{
            textAlign: element.align,
          }}
          {...attributes}
        >
          {children}
        </Box>
      );
    default:
      return (
        <Box
          as={Styled.div}
          sx={{
            textAlign: element.align,
          }}
          {...attributes}
        >
          {children}
        </Box>
      );
  }
};

const Flow = (props) => {
  const editor = useMemo(
    () => withFlow(withHistory(withReact(createEditor()))),
    []
  );
  const [value, setValue] = useState(
    FlowEditor.load("value") || [{ children: [{ text: "" }] }]
  );

  const onChange = (value) => {
    setValue(value);
    FlowEditor.save("value", value);
  };

  return <Slate editor={editor} value={value} onChange={onChange} {...props} />;
};

const FlowEditable = (props) => {
  const editor = useSlate();

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  const renderElement = useCallback((props) => {
    return <Element {...props} />;
  }, []);

  const onKeyDown = (event) => {
    const key = event.key;
    const modKey = FlowEditor.isOnMac() ? event.metaKey : event.ctrlKey;
    const altKey = event.altKey;

    if (modKey) {
      if (altKey) {
        switch (key) {
          case "f":
            event.preventDefault();
            FlowEditor.toggleFullscreen();
            break;
          case "0":
            event.preventDefault();
            FlowEditor.toggleBlock(editor, "paragraph");
            break;
          case "1":
            event.preventDefault();
            FlowEditor.toggleBlock(editor, "heading-one");
            break;
          case "2":
            event.preventDefault();
            FlowEditor.toggleBlock(editor, "heading-two");
            break;
          case "3":
            event.preventDefault();
            FlowEditor.toggleBlock(editor, "heading-three");
            break;
          case "4":
            event.preventDefault();
            FlowEditor.toggleBlock(editor, "heading-four");
            break;
          case "5":
            event.preventDefault();
            FlowEditor.toggleBlock(editor, "heading-five");
            break;
          case "6":
            event.preventDefault();
            FlowEditor.toggleBlock(editor, "heading-six");
            break;
          default:
            break;
        }
      } else {
        switch (key) {
          case "p":
            event.preventDefault();
            FlowEditor.print();
            break;
          case "b":
            event.preventDefault();
            FlowEditor.toggleMark(editor, "bold");
            break;
          case "i":
            event.preventDefault();
            FlowEditor.toggleMark(editor, "italic");
            break;
          case "u":
            event.preventDefault();
            FlowEditor.toggleMark(editor, "underline");
            break;
          case "s":
            event.preventDefault();
            FlowEditor.toggleMark(editor, "strikethrough");
            break;
          default:
            break;
        }
      }
    }
  };

  return (
    <Editable
      autoFocus
      renderLeaf={renderLeaf}
      renderElement={renderElement}
      onKeyDown={onKeyDown}
      {...props}
    />
  );
};

const Textbox = (props) => {
  return (
    <Box
      as={FlowEditable}
      sx={{
        flex: "1 1 auto",
        padding: 5,
        "@media print": {
          padding: 0,
        },
      }}
      {...props}
    />
  );
};

const Toolbox = (props) => {
  return (
    <Box
      bg="background"
      p={5}
      sx={{
        flexWrap: "wrap",
        padding: 5,
        "@supports (position: sticky)": {
          position: "sticky",
        },
        top: 0,
        "@media print": {
          display: "none",
        },
      }}
      {...props}
    />
  );
};

const ActionButton = (props) => {
  const { icon, label, active, disabled, action } = props;

  return (
    <Box
      as={Button}
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={action}
      disabled={disabled}
      color={active ? "primary" : "text"}
      bg={active ? "highlight" : "background"}
      mb={1}
      mr={1}
      sx={{
        "&:disabled": {
          opacity: 0.5,
        },
        "&:focus": {
          outline: 0,
        },
        "&:hover, &:focus": {
          backgroundColor: active ? "highlight" : "muted",
        },
      }}
    >
      <FontAwesomeIcon icon={icon} fixedWidth />
    </Box>
  );
};

const FullscreenButton = (props) => {
  return (
    <ActionButton
      icon="expand"
      label="Fullscreen"
      action={(event) => {
        event.preventDefault();
        FlowEditor.toggleFullscreen();
      }}
      {...props}
    />
  );
};

const UndoButton = (props) => {
  const editor = useSlate();

  return (
    <ActionButton
      disabled={editor.history.undos.length === 0}
      icon="undo"
      label="Undo"
      action={(event) => {
        event.preventDefault();
        HistoryEditor.undo(editor);
      }}
      {...props}
    />
  );
};

const RedoButton = (props) => {
  const editor = useSlate();

  return (
    <ActionButton
      disabled={editor.history.redos.length === 0}
      icon="redo"
      label="Redo"
      action={(event) => {
        event.preventDefault();
        HistoryEditor.redo(editor);
      }}
      {...props}
    />
  );
};

const PrintButton = (props) => {
  return (
    <ActionButton
      icon="print"
      label="Print"
      action={(event) => {
        event.preventDefault();
        FlowEditor.print();
      }}
      {...props}
    />
  );
};

const MarkButton = (props) => {
  const { format } = props;
  const editor = useSlate();

  return (
    <ActionButton
      active={FlowEditor.isMarkActive(editor, format)}
      label="Mark"
      action={(event) => {
        event.preventDefault();
        FlowEditor.toggleMark(editor, format);
      }}
      {...props}
    />
  );
};

const BlockButton = (props) => {
  const { format } = props;
  const editor = useSlate();

  return (
    <ActionButton
      active={FlowEditor.isBlockActive(editor, format)}
      label="Block"
      action={(event) => {
        event.preventDefault();
        FlowEditor.toggleBlock(editor, format);
      }}
      {...props}
    />
  );
};

const AlignButton = (props) => {
  const { format } = props;
  const editor = useSlate();

  return (
    <ActionButton
      active={FlowEditor.isAlignActive(editor, format)}
      label="Align"
      action={(event) => {
        event.preventDefault();
        FlowEditor.toggleAlign(editor, format);
      }}
      {...props}
    />
  );
};

library.add(
  faExpand,
  faUndo,
  faRedo,
  faPrint,
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faRemoveFormat,
  faParagraph,
  faHeading,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faAlignJustify
);

render(<Root />, window.document.getElementById("root"));

// If you want your app to work offline and load faster, you can uncoment
// the code below. Note this comes with some pitfalls.
// See the serviceWorker.js script for details.
//serviceWorker.register();
