# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img [ref=e7]
    - heading "Maximus Engageimus" [level=1] [ref=e9]
    - paragraph [ref=e10]: Sign in to your account
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Email Address
        - textbox "Email Address" [ref=e15]:
          - /placeholder: you@example.com
          - text: test@test.com
      - generic [ref=e16]:
        - generic [ref=e17]: Password
        - generic [ref=e18]:
          - textbox "Password" [ref=e19]:
            - /placeholder: ••••••••
            - text: test1234
          - button [ref=e20] [cursor=pointer]:
            - img [ref=e21]
      - button "Forgot your password?" [ref=e25] [cursor=pointer]
      - button "Sign In" [ref=e26] [cursor=pointer]
    - paragraph [ref=e28]:
      - text: Don't have an account?
      - button "Sign up" [ref=e29] [cursor=pointer]
  - paragraph [ref=e30]: By signing up, you agree to our Terms of Service and Privacy Policy.
```