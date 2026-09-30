import { useCallback, type MouseEvent } from 'react';
import {
  Link,
  NavLink,
  type LinkProps,
  type NavLinkProps,
} from 'react-router-dom';
import { useViewTransitionNavigate } from '@/lib/view-transitions';

type TransitionClickProps = Pick<
  LinkProps,
  | 'to'
  | 'onClick'
  | 'target'
  | 'replace'
  | 'state'
  | 'preventScrollReset'
  | 'relative'
  | 'reloadDocument'
>;

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function useTransitionClickHandler({
  to,
  onClick,
  target,
  replace,
  state,
  preventScrollReset,
  relative,
  reloadDocument,
}: TransitionClickProps) {
  const navigate = useViewTransitionNavigate();

  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);

      if (
        event.defaultPrevented ||
        isModifiedClick(event) ||
        (target != null && target !== '_self') ||
        reloadDocument
      ) {
        return;
      }

      event.preventDefault();
      navigate(to, { replace, state, preventScrollReset, relative });
    },
    [
      navigate,
      onClick,
      preventScrollReset,
      relative,
      reloadDocument,
      replace,
      state,
      target,
      to,
    ]
  );
}

export function TransitionLink(props: LinkProps) {
  const onClick = useTransitionClickHandler(props);
  return <Link {...props} onClick={onClick} />;
}

export function TransitionNavLink(props: NavLinkProps) {
  const onClick = useTransitionClickHandler(props);
  return <NavLink {...props} onClick={onClick} />;
}
