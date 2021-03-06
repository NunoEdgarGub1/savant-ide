/**
 * This file is part of savant-ide.
 * Copyright (c) 2018 - present Zilliqa Research Pvt. Ltd.
 *
 * savant-ide is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * savant-ide is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * savant-ide.  If not, see <http://www.gnu.org/licenses/>.
 */

import classNames from 'classnames';
import * as React from 'react';
import sanitizer from 'dompurify';
import styled from 'styled-components';

import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import ListItem from '@material-ui/core/ListItem';
import ListItemText, { ListItemTextProps } from '@material-ui/core/ListItemText';
import { withTheme, WithTheme } from '@material-ui/core/styles';

import Menu from './Menu';

interface Props extends WithTheme {
  id: string;
  isSelected?: boolean;
  name: string;
  handleSelect: (id: string) => void;
  handlePersist: (id: string, displayName?: string) => void;
  handleDelete: (id: string) => void;
}

interface State {
  name: string;
  isRenaming: boolean;
  isMenuOpen: boolean;
}

const WrappedListText = styled<ListItemTextProps>(ListItemText)`
  & .file {
    display: flex;
  }
`;

const MAX_FILENAME_LENGTH = 20;

class File extends React.Component<Props, State> {
  textNode = React.createRef<HTMLParagraphElement>();
  state: State = { isRenaming: false, isMenuOpen: false, name: '' };
  sanitizer = sanitizer;

  componentDidMount() {
    const { name } = this.props;

    if (!name || (name.length && name.length === 0)) {
      this.setRenaming();
    }

    this.setState({ name });
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    if (!this.textNode.current) {
      return false;
    }

    return (
      nextState.name !== this.textNode.current.innerText ||
      this.state.isRenaming !== nextState.isRenaming ||
      this.state.isMenuOpen !== nextState.isMenuOpen ||
      this.props.isSelected !== nextProps.isSelected
    );
  }

  setRenaming = () => {
    this.setState({ isRenaming: true });

    setTimeout(() => {
      if (this.textNode.current) {
        this.textNode.current.contentEditable = 'true';
        this.textNode.current.focus();
      }
    });
  };

  handleChange = (e: React.SyntheticEvent<HTMLParagraphElement>, text: string) => {
    if (text.length <= MAX_FILENAME_LENGTH) {
      this.setState({ name: this.sanitizer.sanitize(text) });
      return;
    } else {
      e.preventDefault();
    }
  };

  handleDelete = () => {
    this.props.handleDelete(this.props.id);
  };

  handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    // left click
    if (e.button === 0) {
      this.props.handleSelect(this.props.id);
      return;
    }

    if (e.button === 2) {
      this.setState({ isMenuOpen: true });
      return;
    }
  };

  handleCloseContextMenu = () => {
    this.setState({ isMenuOpen: false });
  };

  handleInput: React.ChangeEventHandler<HTMLParagraphElement> = (e) => {
    if (!this.textNode.current) {
      return;
    }

    const text = this.textNode.current.innerText;
    this.handleChange(e, text);
  };

  handleKeyDown: React.KeyboardEventHandler<HTMLParagraphElement> = (e) => {
    if (!this.textNode.current) {
      return;
    }

    // intercept all 'enter' || 'escape' events
    if (e.keyCode === 13 || e.keyCode === 27) {
      e.preventDefault();
      this.textNode.current.blur();
      this.textNode.current.contentEditable = 'false';
      this.props.handlePersist(this.state.name, this.props.id);
      this.setState({ isRenaming: false });
      return;
    }

    this.handleChange(e, this.textNode.current.innerText);
  };

  handleFocus = () => {
    setTimeout(() => {
      if (this.textNode.current && this.textNode.current.childNodes.length) {
        const textNode = this.textNode.current.childNodes[0];
        const sel = window.getSelection();
        const range = document.createRange();
        range.setStart(textNode, textNode.textContent ? textNode.textContent.length : 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  };

  handleBlur = () => {
    if (this.state.isRenaming && this.textNode.current) {
      this.textNode.current.contentEditable = 'false';
      this.props.handlePersist(this.state.name);
      this.setState({ isRenaming: false });
    }
  };

  render() {
    return (
      <React.Fragment>
        <ClickAwayListener onClickAway={this.handleBlur}>
          <ListItem
            key="item"
            divider
            onClick={this.handleClick}
            onContextMenu={this.handleClick}
            style={{ cursor: 'pointer' }}
          >
            <WrappedListText
              classes={{ primary: classNames({ file: true, selected: this.props.isSelected }) }}
            >
              <p
                tabIndex={this.state.isRenaming ? 0 : undefined}
                ref={this.textNode}
                onFocus={this.handleFocus}
                onInput={this.handleInput}
                onKeyDown={this.handleKeyDown}
                dangerouslySetInnerHTML={{ __html: this.state.name }}
                style={{
                  color: this.props.isSelected
                    ? this.props.theme.palette.primary.main
                    : this.props.theme.palette.text.primary,
                }}
              />
              <p
                style={{
                  color: this.props.isSelected
                    ? this.props.theme.palette.primary.main
                    : this.props.theme.palette.text.primary,
                }}
              >
                .scilla
              </p>
            </WrappedListText>
          </ListItem>
        </ClickAwayListener>
        <Menu
          key="ctx"
          handleRename={this.setRenaming}
          handleDelete={this.handleDelete}
          handleClose={this.handleCloseContextMenu}
          isOpen={this.state.isMenuOpen}
          anchorEl={this.textNode}
        />
      </React.Fragment>
    );
  }
}

export default withTheme()(File);
