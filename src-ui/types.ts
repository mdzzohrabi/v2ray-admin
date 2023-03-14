import { JSXElementConstructor, ReactElement } from "react";

export type ChildOf<T extends string | JSXElementConstructor<any>, P> = ReactElement<P, T>[] | ReactElement<P, T> | undefined