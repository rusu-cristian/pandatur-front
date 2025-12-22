import React, { useState } from "react";
import { Button, Flex, TextInput, Title, Box, Text, Stack } from "@mantine/core";
import { api } from "../../api";
import { showServerError } from "../../Components/utils/showServerError";
import { useMobile, useAuth } from "../../hooks";
import "./Login.css";

/**
 * Login — страница авторизации
 * 
 * Best Practices:
 * - Использует useAuth для логина (Single Source of Truth)
 * - Нет прямой работы с cookies — всё через AuthContext
 * - Простая и понятная логика
 */
export const Login = () => {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [isLoading, setIsLoading] = useState(false);
  
  const isMobile = useMobile();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setMessage("Invalid email address.");
      setMessageType("error");
      return false;
    }
    if (!form.password || form.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType("error");
      return false;
    }
    if (!isLogin && !form.username) {
      setMessage("Username is required for registration.");
      setMessageType("error");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    const data = isLogin
      ? { email: form.email, password: form.password }
      : form;
    const request = isLogin ? api.auth.login : api.auth.register;

    try {
      const response = await request(data);
      const { token, message: responseMessage, user_id } = response;

      setMessage(responseMessage || "Success!");
      setMessageType("success");

      if (isLogin && token) {
        // Используем login из AuthContext — он сохранит токен и сделает редирект
        login(token, user_id);
      }
    } catch (error) {
      setMessage(showServerError(error));
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = () => {
    setIsLogin(!isLogin);
    setForm({ ...form, username: "" });
    setMessage("");
    setMessageType("error");
  };

  return (
    <div className="body-login">
      <div className="login-background"></div>
      <div className="body-login-form">
        <Box
          w={isMobile ? "100%" : "20%"}
          className="login-form"
          maw={isMobile ? "90%" : "100%"}
        >
          <img
            src="/panda-tur.png"
            alt="Panda Tur Logo"
            className="login-panda-logo"
          />

          <Title
            order={1}
            ta="center"
            mb={isMobile ? "md" : "lg"}
          >
            Panda Tur CRM
          </Title>

          <Stack w={isMobile ? "100%" : "80%"} gap={isMobile ? "sm" : "md"}>
            {!isLogin && (
              <TextInput
                name="username"
                value={form.username}
                onChange={handleInputChange}
                placeholder="Username"
                disabled={isLoading}
                size={isMobile ? "sm" : "md"}
              />
            )}

            <TextInput
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="Email"
              disabled={isLoading}
              size={isMobile ? "sm" : "md"}
            />

            <TextInput
              type="password"
              name="password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="Password"
              disabled={isLoading}
              size={isMobile ? "sm" : "md"}
            />

            <Flex gap={isMobile ? "sm" : "md"} direction="column">
              <Button
                fullWidth
                disabled={isLoading}
                onClick={handleSubmit}
                size={isMobile ? "sm" : "md"}
              >
                {isLogin ? "Login" : "Register"}
              </Button>

              <Button
                fullWidth
                onClick={handleSwitch}
                disabled={isLoading}
                variant="outline"
                size={isMobile ? "sm" : "md"}
              >
                {isLogin ? "Register" : "Login"}
              </Button>
            </Flex>

            {message && (
              <Text
                c={messageType === "success" ? "green" : "red"}
                size={isMobile ? "sm" : "md"}
                mt={isMobile ? "sm" : "md"}
                fw={500}
              >
                {message}
              </Text>
            )}
          </Stack>

          <Text
            c="dimmed"
            size="xs"
            ta="center"
            mt="xl"
            style={{ opacity: 0.7 }}
          >
            © 2025 Panda Tur CRM. All rights reserved.
          </Text>
        </Box>
      </div>
    </div>
  );
};
