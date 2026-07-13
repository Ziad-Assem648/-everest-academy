import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "../LangContext";

export default function FreeCourseViewPage() {
  const { t } = useLang();
  const { id } = useParams();
  const nav = useNavigate();
  useEffect(() => { nav("/courses/" + id, { replace: true }); }, [id]);
  return null;
}
